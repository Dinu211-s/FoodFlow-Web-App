const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, staffOrAdmin } = require('../middleware/auth');

// Get all ingredients
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *, 
             CASE WHEN quantity_available <= min_quantity THEN true ELSE false END as is_low_stock
      FROM ingredients
      ORDER BY ingredient_name
    `);

    res.json({ ingredients: result.rows });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

// Get low stock ingredients
router.get('/low-stock', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM ingredients
      WHERE quantity_available <= min_quantity
      ORDER BY quantity_available ASC
    `);

    res.json({ low_stock_ingredients: result.rows });
  } catch (error) {
    console.error('Error fetching low stock:', error);
    res.status(500).json({ error: 'Failed to fetch low stock ingredients' });
  }
});

// Get single ingredient
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM ingredients WHERE ingredient_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json({ ingredient: result.rows[0] });
  } catch (error) {
    console.error('Error fetching ingredient:', error);
    res.status(500).json({ error: 'Failed to fetch ingredient' });
  }
});

// Create ingredient (staff/admin only)
router.post('/', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { ingredient_name, unit, quantity_available, min_quantity, unit_price } = req.body;

    const result = await pool.query(
      `INSERT INTO ingredients (ingredient_name, unit, quantity_available, min_quantity, unit_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ingredient_name, unit, quantity_available || 0, min_quantity || 0, unit_price]
    );

    res.status(201).json({
      message: 'Ingredient added successfully',
      ingredient: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating ingredient:', error);
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// Update ingredient (staff/admin only)
router.put('/:id', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { ingredient_name, unit, quantity_available, min_quantity, unit_price } = req.body;

    const result = await pool.query(
      `UPDATE ingredients 
       SET ingredient_name = $1, unit = $2, quantity_available = $3, 
           min_quantity = $4, unit_price = $5, updated_at = CURRENT_TIMESTAMP
       WHERE ingredient_id = $6 RETURNING *`,
      [ingredient_name, unit, quantity_available, min_quantity, unit_price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json({
      message: 'Ingredient updated successfully',
      ingredient: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// Adjust ingredient stock (staff/admin only)
router.post('/:id/adjust', authMiddleware, staffOrAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { quantity, transaction_type, notes } = req.body; // transaction_type: 'add' or 'deduct'

    await client.query('BEGIN');

    let updateQuery;
    if (transaction_type === 'add') {
      updateQuery = `
        UPDATE ingredients 
        SET quantity_available = quantity_available + $1, updated_at = CURRENT_TIMESTAMP
        WHERE ingredient_id = $2 RETURNING *
      `;
    } else if (transaction_type === 'deduct') {
      updateQuery = `
        UPDATE ingredients 
        SET quantity_available = quantity_available - $1, updated_at = CURRENT_TIMESTAMP
        WHERE ingredient_id = $2 RETURNING *
      `;
    } else {
      throw new Error('Invalid transaction type');
    }

    const result = await client.query(updateQuery, [quantity, id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    // Log transaction
    await client.query(
      `INSERT INTO inventory_transactions 
       (ingredient_id, transaction_type, quantity, reference_type, notes, created_by)
       VALUES ($1, $2, $3, 'manual_adjustment', $4, $5)`,
      [id, transaction_type, quantity, notes, req.user.user_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Stock adjusted successfully',
      ingredient: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: error.message || 'Failed to adjust stock' });
  } finally {
    client.release();
  }
});

// Get ingredient transaction history
router.get('/:id/transactions', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*, u.username as created_by_username
       FROM inventory_transactions t
       LEFT JOIN users u ON t.created_by = u.user_id
       WHERE t.ingredient_id = $1
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [id]
    );

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Delete ingredient (staff/admin only)
router.delete('/:id', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM ingredients WHERE ingredient_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

module.exports = router;
