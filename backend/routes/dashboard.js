const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, staffOrAdmin } = require('../middleware/auth');

// Get dashboard statistics (staff/admin only)
router.get('/stats', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    // Total orders
    const ordersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE order_status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE order_status = 'confirmed') as confirmed_orders,
        COUNT(*) FILTER (WHERE order_status = 'delivered') as delivered_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) as total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE order_status != 'cancelled'), 0) as total_sales
      FROM orders
      WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // Low stock ingredients
    const lowStockResult = await pool.query(`
      SELECT COUNT(*) as low_stock_count
      FROM ingredients
      WHERE quantity_available <= min_quantity
    `);

    // Total ingredients
    const ingredientsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_ingredients,
        COALESCE(SUM(quantity_available * unit_price), 0) as inventory_value
      FROM ingredients
    `);

    // Cutlery status
    const cutleryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(total_quantity), 0) as total_pieces,
        COALESCE(SUM(damaged_quantity), 0) as damaged_pieces,
        COALESCE(SUM(usable_quantity), 0) as usable_pieces
      FROM cutlery
    `);

    // Recent orders
    const recentOrdersResult = await pool.query(`
      SELECT o.order_id, o.order_date, o.event_date, o.total_amount, o.order_status, 
             u.full_name as customer_name
      FROM orders o
      JOIN users u ON o.customer_id = u.user_id
      ORDER BY o.order_date DESC
      LIMIT 5
    `);

    // Popular packages
    const popularPackagesResult = await pool.query(`
      SELECT p.package_name, COUNT(oi.order_item_id) as order_count, 
             SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN packages p ON oi.package_id = p.package_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY p.package_id, p.package_name
      ORDER BY order_count DESC
      LIMIT 5
    `);

    res.json({
      orders: ordersResult.rows[0],
      inventory: {
        ...ingredientsResult.rows[0],
        low_stock_count: lowStockResult.rows[0].low_stock_count
      },
      cutlery: cutleryResult.rows[0],
      recent_orders: recentOrdersResult.rows,
      popular_packages: popularPackagesResult.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get order trends (staff/admin only)
router.get('/trends', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { period = '7days' } = req.query;
    
    let interval;
    switch(period) {
      case '7days':
        interval = '7 days';
        break;
      case '30days':
        interval = '30 days';
        break;
      case '90days':
        interval = '90 days';
        break;
      default:
        interval = '7 days';
    }

    const result = await pool.query(`
      SELECT 
        DATE(order_date) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as revenue
      FROM orders
      WHERE order_date >= CURRENT_DATE - INTERVAL '${interval}'
      GROUP BY DATE(order_date)
      ORDER BY date
    `);

    res.json({ trends: result.rows });
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Get inventory alerts (staff/admin only)
router.get('/alerts', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    // Low stock alerts
    const lowStockResult = await pool.query(`
      SELECT ingredient_id, ingredient_name, quantity_available, min_quantity, unit
      FROM ingredients
      WHERE quantity_available <= min_quantity
      ORDER BY quantity_available ASC
    `);

    // Damaged cutlery alerts
    const damagedCutleryResult = await pool.query(`
      SELECT cutlery_id, item_name, damaged_quantity, total_quantity
      FROM cutlery
      WHERE damaged_quantity > 0
      ORDER BY damaged_quantity DESC
    `);

    res.json({
      low_stock: lowStockResult.rows,
      damaged_cutlery: damagedCutleryResult.rows
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

module.exports = router;
