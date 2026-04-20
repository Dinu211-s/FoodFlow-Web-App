const pool = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Packages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS packages (
        package_id SERIAL PRIMARY KEY,
        package_name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        serves INTEGER NOT NULL,
        image_url VARCHAR(255),
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ingredients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ingredients (
        ingredient_id SERIAL PRIMARY KEY,
        ingredient_name VARCHAR(100) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        quantity_available DECIMAL(10, 2) NOT NULL DEFAULT 0,
        min_quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
        unit_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Package ingredients (many-to-many relationship)
    await client.query(`
      CREATE TABLE IF NOT EXISTS package_ingredients (
        id SERIAL PRIMARY KEY,
        package_id INTEGER REFERENCES packages(package_id) ON DELETE CASCADE,
        ingredient_id INTEGER REFERENCES ingredients(ingredient_id) ON DELETE CASCADE,
        quantity_needed DECIMAL(10, 2) NOT NULL,
        UNIQUE(package_id, ingredient_id)
      );
    `);

    // Cutlery/Equipment table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cutlery (
        cutlery_id SERIAL PRIMARY KEY,
        item_name VARCHAR(100) NOT NULL,
        total_quantity INTEGER NOT NULL DEFAULT 0,
        damaged_quantity INTEGER NOT NULL DEFAULT 0,
        usable_quantity INTEGER GENERATED ALWAYS AS (total_quantity - damaged_quantity) STORED,
        item_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(user_id),
        order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        event_date DATE NOT NULL,
        event_time TIME,
        delivery_address TEXT NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'online')),
        payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
        order_status VARCHAR(20) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
        package_id INTEGER REFERENCES packages(package_id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Inventory transactions log
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        transaction_id SERIAL PRIMARY KEY,
        ingredient_id INTEGER REFERENCES ingredients(ingredient_id),
        transaction_type VARCHAR(20) CHECK (transaction_type IN ('add', 'deduct', 'adjust')),
        quantity DECIMAL(10, 2) NOT NULL,
        reference_type VARCHAR(50),
        reference_id INTEGER,
        notes TEXT,
        created_by INTEGER REFERENCES users(user_id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('✓ All tables created successfully');

    // Insert sample data
    await insertSampleData(client);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

const insertSampleData = async (client) => {
  try {
    // Check if admin user exists
    const adminCheck = await client.query(
      "SELECT * FROM users WHERE username = 'admin'"
    );

    if (adminCheck.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);

      // Insert admin user
      await client.query(`
        INSERT INTO users (username, email, password_hash, full_name, role, phone)
        VALUES 
        ('admin', 'admin@foodflow.com', $1, 'System Administrator', 'admin', '+1234567890'),
        ('customer1', 'customer@example.com', $1, 'John Doe', 'customer', '+1987654321'),
        ('staff1', 'staff@foodflow.com', $1, 'Jane Smith', 'staff', '+1122334455')
      `, [hashedPassword]);

      console.log('✓ Sample users created (password: admin123)');

      // Insert sample ingredients
      await client.query(`
        INSERT INTO ingredients (ingredient_name, unit, quantity_available, min_quantity, unit_price)
        VALUES 
        ('Chicken Breast', 'kg', 50.00, 10.00, 8.50),
        ('Rice', 'kg', 100.00, 20.00, 2.00),
        ('Vegetables Mix', 'kg', 30.00, 10.00, 3.50),
        ('Pasta', 'kg', 40.00, 15.00, 3.00),
        ('Tomato Sauce', 'liters', 25.00, 5.00, 4.00),
        ('Beef', 'kg', 35.00, 10.00, 12.00),
        ('Cheese', 'kg', 20.00, 5.00, 10.00),
        ('Bread Rolls', 'pieces', 200, 50, 0.50)
      `);

      console.log('✓ Sample ingredients added');

      // Insert sample packages
      await client.query(`
        INSERT INTO packages (package_name, description, price, serves, is_available)
        VALUES 
        ('Classic Chicken Package', 'Grilled chicken with rice and vegetables', 299.99, 10, true),
        ('Italian Pasta Special', 'Fresh pasta with tomato sauce and cheese', 249.99, 8, true),
        ('Beef Deluxe Package', 'Premium beef with sides and bread', 399.99, 10, true),
        ('Vegetarian Feast', 'Assorted vegetables with rice', 199.99, 12, true)
      `);

      console.log('✓ Sample packages added');

      // Link ingredients to packages
      await client.query(`
        INSERT INTO package_ingredients (package_id, ingredient_id, quantity_needed)
        VALUES 
        (1, 1, 3.0), (1, 2, 2.0), (1, 3, 2.0),
        (2, 4, 2.5), (2, 5, 1.5), (2, 7, 1.0),
        (3, 6, 3.5), (3, 2, 1.5), (3, 8, 20),
        (4, 3, 4.0), (4, 2, 3.0), (4, 7, 0.5)
      `);

      console.log('✓ Package ingredients linked');

      // Insert sample cutlery
      await client.query(`
        INSERT INTO cutlery (item_name, total_quantity, damaged_quantity, item_type)
        VALUES 
        ('Dinner Plates', 200, 15, 'plates'),
        ('Forks', 300, 20, 'utensils'),
        ('Knives', 300, 18, 'utensils'),
        ('Spoons', 300, 12, 'utensils'),
        ('Serving Bowls', 50, 3, 'serving'),
        ('Glasses', 250, 25, 'glassware'),
        ('Chafing Dishes', 20, 2, 'equipment')
      `);

      console.log('✓ Sample cutlery added');

      console.log('\n=================================');
      console.log('Sample Data Summary:');
      console.log('=================================');
      console.log('Admin Login:');
      console.log('  Username: admin');
      console.log('  Password: admin123');
      console.log('\nCustomer Login:');
      console.log('  Username: customer1');
      console.log('  Password: admin123');
      console.log('=================================\n');
    }
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
};

const initDatabase = async () => {
  try {
    console.log('Initializing FoodFlow Database...\n');
    await createTables();
    console.log('\n✓ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

initDatabase();
