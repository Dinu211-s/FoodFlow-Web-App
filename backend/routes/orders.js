const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, staffOrAdmin } = require('../middleware/auth');

// Get all orders (customers see only their orders, staff/admin see all)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'customer') {
      query = `
        SELECT o.*, u.full_name as customer_name, u.email, u.phone,
               json_agg(
                 json_build_object(
                   'order_item_id', oi.order_item_id,
                   'package_id', oi.package_id,
                   'package_name', p.package_name,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'subtotal', oi.subtotal
                 )
               ) as items
        FROM orders o
        JOIN users u ON o.customer_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN packages p ON oi.package_id = p.package_id
        WHERE o.customer_id = $1
        GROUP BY o.order_id, u.full_name, u.email, u.phone
        ORDER BY o.order_date DESC
      `;
      params = [req.user.user_id];
    } else {
      query = `
        SELECT o.*, u.full_name as customer_name, u.email, u.phone,
               json_agg(
                 json_build_object(
                   'order_item_id', oi.order_item_id,
                   'package_id', oi.package_id,
                   'package_name', p.package_name,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'subtotal', oi.subtotal
                 )
               ) as items
        FROM orders o
        JOIN users u ON o.customer_id = u.user_id
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN packages p ON oi.package_id = p.package_id
        GROUP BY o.order_id, u.full_name, u.email, u.phone
        ORDER BY o.order_date DESC
      `;
    }

    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT o.*, u.full_name as customer_name, u.email, u.phone, u.address as customer_address,
             json_agg(
               json_build_object(
                 'order_item_id', oi.order_item_id,
                 'package_id', oi.package_id,
                 'package_name', p.package_name,
                 'quantity', oi.quantity,
                 'unit_price', oi.unit_price,
                 'subtotal', oi.subtotal
               )
             ) as items
      FROM orders o
      JOIN users u ON o.customer_id = u.user_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN packages p ON oi.package_id = p.package_id
      WHERE o.order_id = $1
      GROUP BY o.order_id, u.full_name, u.email, u.phone, u.address
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    // Check authorization
    if (req.user.role === 'customer' && order.customer_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Create new order
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { event_date, event_time, delivery_address, payment_method, notes, items } = req.body;
    const customer_id = req.user.user_id;

    await client.query('BEGIN');

    // Calculate total and validate stock
    let total_amount = 0;
    const orderItems = [];

    for (const item of items) {
      // Get package details and ingredients
      const packageResult = await client.query(`
        SELECT p.*, 
               json_agg(
                 json_build_object(
                   'ingredient_id', i.ingredient_id,
                   'ingredient_name', i.ingredient_name,
                   'quantity_needed', pi.quantity_needed,
                   'quantity_available', i.quantity_available
                 )
               ) FILTER (WHERE i.ingredient_id IS NOT NULL) as ingredients
        FROM packages p
        LEFT JOIN package_ingredients pi ON p.package_id = pi.package_id
        LEFT JOIN ingredients i ON pi.ingredient_id = i.ingredient_id
        WHERE p.package_id = $1
        GROUP BY p.package_id
      `, [item.package_id]);

      if (packageResult.rows.length === 0) {
        throw new Error(`Package ${item.package_id} not found`);
      }

      const package = packageResult.rows[0];
      
      // Check ingredient availability
      if (package.ingredients) {
        for (const ingredient of package.ingredients) {
          const requiredQty = ingredient.quantity_needed * item.quantity;
          if (ingredient.quantity_available < requiredQty) {
            throw new Error(
              `Insufficient ${ingredient.ingredient_name}. Required: ${requiredQty}, Available: ${ingredient.quantity_available}`
            );
          }
        }
      }

      const subtotal = package.price * item.quantity;
      total_amount += subtotal;
      
      orderItems.push({
        package_id: item.package_id,
        quantity: item.quantity,
        unit_price: package.price,
        subtotal,
        ingredients: package.ingredients
      });
    }

    // Create order
    const orderResult = await client.query(`
      INSERT INTO orders 
      (customer_id, event_date, event_time, delivery_address, total_amount, payment_method, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [customer_id, event_date, event_time, delivery_address, total_amount, payment_method, notes]);

    const order = orderResult.rows[0];

    // Insert order items and deduct inventory
    for (const item of orderItems) {
      // Insert order item
      await client.query(`
        INSERT INTO order_items (order_id, package_id, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
      `, [order.order_id, item.package_id, item.quantity, item.unit_price, item.subtotal]);

      // Deduct ingredients
      if (item.ingredients) {
        for (const ingredient of item.ingredients) {
          const deductQty = ingredient.quantity_needed * item.quantity;
          
          await client.query(`
            UPDATE ingredients 
            SET quantity_available = quantity_available - $1, updated_at = CURRENT_TIMESTAMP
            WHERE ingredient_id = $2
          `, [deductQty, ingredient.ingredient_id]);

          // Log transaction
          await client.query(`
            INSERT INTO inventory_transactions 
            (ingredient_id, transaction_type, quantity, reference_type, reference_id, created_by)
            VALUES ($1, 'deduct', $2, 'order', $3, $4)
          `, [ingredient.ingredient_id, deductQty, order.order_id, customer_id]);
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  } finally {
    client.release();
  }
});

// Update order status (staff/admin only)
router.patch('/:id/status', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, payment_status } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (order_status) {
      updates.push(`order_status = $${paramCount++}`);
      values.push(order_status);
    }
    if (payment_status) {
      updates.push(`payment_status = $${paramCount++}`);
      values.push(payment_status);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE orders SET ${updates.join(', ')} WHERE order_id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated',
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Cancel order (customer can cancel their own pending orders)
router.delete('/:id', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Get order details
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check authorization
    if (req.user.role === 'customer' && order.customer_id !== req.user.user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied' });
    }

    if (order.order_status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only pending orders can be cancelled' });
    }

    // Restore inventory
    const itemsResult = await client.query(`
      SELECT oi.*, pi.ingredient_id, pi.quantity_needed
      FROM order_items oi
      JOIN package_ingredients pi ON oi.package_id = pi.package_id
      WHERE oi.order_id = $1
    `, [id]);

    for (const item of itemsResult.rows) {
      const restoreQty = item.quantity_needed * item.quantity;
      
      await client.query(`
        UPDATE ingredients 
        SET quantity_available = quantity_available + $1
        WHERE ingredient_id = $2
      `, [restoreQty, item.ingredient_id]);

      await client.query(`
        INSERT INTO inventory_transactions 
        (ingredient_id, transaction_type, quantity, reference_type, reference_id, notes, created_by)
        VALUES ($1, 'add', $2, 'order_cancelled', $3, 'Order cancelled - inventory restored', $4)
      `, [item.ingredient_id, restoreQty, id, req.user.user_id]);
    }

    // Update order status
    await client.query(
      `UPDATE orders SET order_status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
       WHERE order_id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  } finally {
    client.release();
  }
});

module.exports = router;
