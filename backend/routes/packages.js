const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, staffOrAdmin } = require('../middleware/auth');

// Get all packages (public)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             json_agg(
               json_build_object(
                 'ingredient_id', i.ingredient_id,
                 'ingredient_name', i.ingredient_name,
                 'quantity_needed', pi.quantity_needed,
                 'unit', i.unit
               )
             ) FILTER (WHERE i.ingredient_id IS NOT NULL) as ingredients
      FROM packages p
      LEFT JOIN package_ingredients pi ON p.package_id = pi.package_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.ingredient_id
      WHERE p.is_available = true
      GROUP BY p.package_id
      ORDER BY p.package_id
    `);

    res.json({ packages: result.rows });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Get single package
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, 
             json_agg(
               json_build_object(
                 'ingredient_id', i.ingredient_id,
                 'ingredient_name', i.ingredient_name,
                 'quantity_needed', pi.quantity_needed,
                 'unit', i.unit,
                 'quantity_available', i.quantity_available
               )
             ) FILTER (WHERE i.ingredient_id IS NOT NULL) as ingredients
      FROM packages p
      LEFT JOIN package_ingredients pi ON p.package_id = pi.package_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.ingredient_id
      WHERE p.package_id = $1
      GROUP BY p.package_id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ package: result.rows[0] });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({ error: 'Failed to fetch package' });
  }
});

// Create package (staff/admin only)
router.post('/', authMiddleware, staffOrAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { package_name, description, price, serves, image_url, ingredients } = req.body;

    await client.query('BEGIN');

    // Insert package
    const packageResult = await client.query(
      `INSERT INTO packages (package_name, description, price, serves, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [package_name, description, price, serves, image_url]
    );

    const newPackage = packageResult.rows[0];

    // Insert package ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        await client.query(
          `INSERT INTO package_ingredients (package_id, ingredient_id, quantity_needed)
           VALUES ($1, $2, $3)`,
          [newPackage.package_id, ingredient.ingredient_id, ingredient.quantity_needed]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Package created successfully',
      package: newPackage
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create package' });
  } finally {
    client.release();
  }
});

// Update package (staff/admin only)
router.put('/:id', authMiddleware, staffOrAdmin, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { package_name, description, price, serves, image_url, is_available = true, ingredients } = req.body;

    await client.query('BEGIN');

    // Update package
    const result = await client.query(
      `UPDATE packages 
       SET package_name = $1, description = $2, price = $3, serves = $4, 
           image_url = $5, is_available = $6, updated_at = CURRENT_TIMESTAMP
       WHERE package_id = $7 RETURNING *`,
      [package_name, description, price, serves, image_url, is_available, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Package not found' });
    }

    // Update ingredients if provided
    if (ingredients) {
      await client.query('DELETE FROM package_ingredients WHERE package_id = $1', [id]);
      
      for (const ingredient of ingredients) {
        await client.query(
          `INSERT INTO package_ingredients (package_id, ingredient_id, quantity_needed)
           VALUES ($1, $2, $3)`,
          [id, ingredient.ingredient_id, ingredient.quantity_needed]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Package updated successfully',
      package: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  } finally {
    client.release();
  }
});

// Delete package (staff/admin only)
router.delete('/:id', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM packages WHERE package_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found' });
    }

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

module.exports = router;
