const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, staffOrAdmin } = require('../middleware/auth');

// Get all cutlery items
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM cutlery
      ORDER BY item_name
    `);

    res.json({ cutlery: result.rows });
  } catch (error) {
    console.error('Error fetching cutlery:', error);
    res.status(500).json({ error: 'Failed to fetch cutlery' });
  }
});

// Get single cutlery item
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM cutlery WHERE cutlery_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cutlery item not found' });
    }

    res.json({ cutlery: result.rows[0] });
  } catch (error) {
    console.error('Error fetching cutlery:', error);
    res.status(500).json({ error: 'Failed to fetch cutlery' });
  }
});

// Create cutlery item (staff/admin only)
router.post('/', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { item_name, total_quantity, damaged_quantity, item_type } = req.body;

    const result = await pool.query(
      `INSERT INTO cutlery (item_name, total_quantity, damaged_quantity, item_type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [item_name, total_quantity || 0, damaged_quantity || 0, item_type]
    );

    res.status(201).json({
      message: 'Cutlery item added successfully',
      cutlery: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating cutlery:', error);
    res.status(500).json({ error: 'Failed to create cutlery item' });
  }
});

// Update cutlery item (staff/admin only)
router.put('/:id', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { item_name, total_quantity, damaged_quantity, item_type } = req.body;

    const result = await pool.query(
      `UPDATE cutlery 
       SET item_name = $1, total_quantity = $2, damaged_quantity = $3, 
           item_type = $4, updated_at = CURRENT_TIMESTAMP
       WHERE cutlery_id = $5 RETURNING *`,
      [item_name, total_quantity, damaged_quantity, item_type, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cutlery item not found' });
    }

    res.json({
      message: 'Cutlery item updated successfully',
      cutlery: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating cutlery:', error);
    res.status(500).json({ error: 'Failed to update cutlery item' });
  }
});

// Report damaged items (staff/admin only)
router.patch('/:id/damage', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { additional_damaged } = req.body;

    const result = await pool.query(
      `UPDATE cutlery 
       SET damaged_quantity = damaged_quantity + $1, updated_at = CURRENT_TIMESTAMP
       WHERE cutlery_id = $2 RETURNING *`,
      [additional_damaged, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cutlery item not found' });
    }

    res.json({
      message: 'Damage reported successfully',
      cutlery: result.rows[0]
    });
  } catch (error) {
    console.error('Error reporting damage:', error);
    res.status(500).json({ error: 'Failed to report damage' });
  }
});

// Delete cutlery item (staff/admin only)
router.delete('/:id', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM cutlery WHERE cutlery_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cutlery item not found' });
    }

    res.json({ message: 'Cutlery item deleted successfully' });
  } catch (error) {
    console.error('Error deleting cutlery:', error);
    res.status(500).json({ error: 'Failed to delete cutlery item' });
  }
});

module.exports = router;
