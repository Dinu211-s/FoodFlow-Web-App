# FoodFlow - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

## Installation Steps

### 1. Database Setup

First, create a PostgreSQL database:

```bash
# Open PostgreSQL command line (psql)
psql -U postgres

# Create database
CREATE DATABASE foodflow_db;

# Exit psql
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment
# Edit the .env file and update database credentials if needed

# Initialize database (creates tables and sample data)
npm run init-db

# Start backend server
npm run dev
```

The backend will run on http://localhost:5000

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will run on http://localhost:3000

## Demo Accounts

After database initialization, use these accounts:

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Customer Account:**
- Username: `customer1`
- Password: `admin123`

**Staff Account:**
- Username: `staff1`
- Password: `admin123`

## Features by Role

### Admin/Staff Features:
- Dashboard with business analytics
- View and manage all orders
- Update order status
- Manage catering packages (create, edit, delete)
- Track ingredient inventory
- Monitor cutlery and equipment
- View low stock alerts
- Adjust stock levels

### Customer Features:
- Browse catering packages
- Add packages to cart
- Place orders with event details
- Select payment method
- View order history
- Track order status
- Cancel pending orders

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user

### Packages
- GET `/api/packages` - Get all packages
- GET `/api/packages/:id` - Get package by ID
- POST `/api/packages` - Create package (staff/admin)
- PUT `/api/packages/:id` - Update package (staff/admin)
- DELETE `/api/packages/:id` - Delete package (staff/admin)

### Orders
- GET `/api/orders` - Get orders
- GET `/api/orders/:id` - Get order by ID
- POST `/api/orders` - Create order
- PATCH `/api/orders/:id/status` - Update status (staff/admin)
- DELETE `/api/orders/:id` - Cancel order

### Ingredients
- GET `/api/ingredients` - Get all ingredients
- GET `/api/ingredients/low-stock` - Get low stock items
- POST `/api/ingredients` - Create ingredient (staff/admin)
- PUT `/api/ingredients/:id` - Update ingredient (staff/admin)
- POST `/api/ingredients/:id/adjust` - Adjust stock (staff/admin)
- DELETE `/api/ingredients/:id` - Delete ingredient (staff/admin)

### Cutlery
- GET `/api/cutlery` - Get all cutlery items
- POST `/api/cutlery` - Create cutlery item (staff/admin)
- PUT `/api/cutlery/:id` - Update item (staff/admin)
- PATCH `/api/cutlery/:id/damage` - Report damage (staff/admin)
- DELETE `/api/cutlery/:id` - Delete item (staff/admin)

### Dashboard
- GET `/api/dashboard/stats` - Get dashboard statistics
- GET `/api/dashboard/trends` - Get order trends
- GET `/api/dashboard/alerts` - Get alerts

## Project Structure

```
foodflow/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── packages.js
│   │   ├── orders.js
│   │   ├── ingredients.js
│   │   ├── cutlery.js
│   │   └── dashboard.js
│   ├── scripts/
│   │   └── initDatabase.js
│   ├── .env
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── Navbar.css
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Dashboard.js
    │   │   ├── BrowsePackages.js
    │   │   ├── Checkout.js
    │   │   ├── MyOrders.js
    │   │   ├── ManageOrders.js
    │   │   ├── ManagePackages.js
    │   │   └── ManageInventory.js
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `foodflow_db` exists

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Set `PORT=3001` in environment

### npm Install Fails
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

## Testing the Application

1. Start backend and frontend servers
2. Open http://localhost:3000
3. Login as admin (admin/admin123)
4. Explore dashboard, manage packages and inventory
5. Login as customer (customer1/admin123)
6. Browse packages and place an order
7. Login as admin again to manage the order

## Next Steps

To extend the application:
- Add image upload for packages
- Implement online payment gateway
- Add email notifications
- Create mobile responsive design improvements
- Add advanced reporting and analytics
- Implement supplier management
- Add automated restock alerts

## Support

For issues or questions about the application, refer to the code comments or API documentation above.
