const express = require('express');
const fs = require('fs').promises; // Use promises to handle asynchronous file operations
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS

const app = express();
const PORT = 3000;

app.use(cors()); // Enable all CORS requests
app.use(bodyParser.json());

// Serve static files after the API routes
app.use(express.static(path.join(__dirname, 'public')));

const USERS_FILE = './data/users.json';
const CART_FILE = './data/cart.json';

// Fetch users for login validation
app.get('/users', async (req, res) => {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading users file:', err);
        res.status(500).json({ error: 'Error reading users file' });
    }
});

// Fetch user's cart based on username
app.get('/cart/:username', async (req, res) => {
    const username = req.params.username;
    console.log(`Fetching cart for user: ${username}`);  // Add this log to verify the username
    try {
        const data = await fs.readFile(CART_FILE, 'utf-8');
        console.log(`Cart data: ${data}`);  // Log the cart data being fetched
        const cartData = JSON.parse(data);
        const userCart = cartData[username] || [];
        res.json(userCart);
    } catch (err) {
        console.error('Error reading cart file:', err);
        res.status(500).json({ error: 'Error reading cart file' });
    }
});



// Update user's cart
app.post('/cart', async (req, res) => {
    const { username, cart } = req.body;
    try {
        const data = await fs.readFile(CART_FILE, 'utf-8');
        const cartData = JSON.parse(data);
        cartData[username] = cart;

        await fs.writeFile(CART_FILE, JSON.stringify(cartData, null, 2));
        res.json({ success: true, message: 'Cart updated successfully' });
    } catch (err) {
        console.error('Error updating cart file:', err);
        res.status(500).json({ error: 'Error updating cart file' });
    }
});

// Handle purchase (clear user's cart)
app.post('/purchase', async (req, res) => {
    const { username } = req.body;
    try {
        const data = await fs.readFile(CART_FILE, 'utf-8');
        const cartData = JSON.parse(data);
        cartData[username] = [];  // Clear the user's cart

        await fs.writeFile(CART_FILE, JSON.stringify(cartData, null, 2));
        res.json({ success: true, message: 'Purchase completed and cart cleared' });
    } catch (err) {
        console.error('Error clearing cart file:', err);
        res.status(500).json({ error: 'Error clearing cart file' });
    }
});


// Register a new user
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        const users = JSON.parse(data);

        if (users.some(user => user.username === username)) {
            return res.json({ success: false, message: 'Username already exists' });
        }

        users.push({ username, password });
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        res.json({ success: true, message: 'Registration successful' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ error: 'Error registering user' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
