const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CART_FILE = path.join(DATA_DIR, 'cart.json');

const foodItems = {
    'Vegetable Curry': {
        price: 120,
        image: './images/vb.jpg',
        description: 'A delicious mix of fresh vegetables in aromatic curry sauce.'
    },
    'Chicken Biryani': {
        price: 150,
        image: './images/cb.jpg',
        description: 'Fragrant basmati rice cooked with tender chicken and aromatic spices.'
    },
    'Paneer Butter Masala': {
        price: 130,
        image: './images/pb.jpg',
        description: 'Cottage cheese cubes in rich, creamy tomato gravy.'
    }
};

async function initializeDataFiles() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        if (!await fileExists(USERS_FILE)) {
            await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));
            console.log('Created users.json');
        }

        if (!await fileExists(CART_FILE)) {
            await fs.writeFile(CART_FILE, JSON.stringify({}, null, 2));
            console.log('Created cart.json');
        }
    } catch (error) {
        console.error('Error initializing data files:', error);
        throw error;
    }
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

app.get('/food-items', (req, res) => {
    res.json({ success: true, foodItems });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        const users = await readJsonFile(USERS_FILE);
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        const users = await readJsonFile(USERS_FILE);

        if (users.some(u => u.username === username)) {
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        users.push({ username, password });
        await writeJsonFile(USERS_FILE, users);

        const carts = await readJsonFile(CART_FILE);
        carts[username] = {};
        await writeJsonFile(CART_FILE, carts);

        res.json({ success: true });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/cart/:username', async (req, res) => {
    const { username } = req.params;
    
    if (!username) {
        return res.status(400).json({ success: false, message: 'Username is required' });
    }

    try {
        const carts = await readJsonFile(CART_FILE);
        res.json({ success: true, cart: carts[username] || {} });
    } catch (err) {
        console.error('Error reading cart:', err);
        res.status(500).json({ success: false, message: 'Error reading cart' });
    }
});

app.post('/cart/:username/update', async (req, res) => {
    const { username } = req.params;
    const { item, quantity } = req.body;

    if (!username || !item || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'Username, item, and quantity are required' });
    }

    try {
        const carts = await readJsonFile(CART_FILE);

        if (!carts[username]) {
            carts[username] = {};
        }

        if (quantity <= 0) {
            delete carts[username][item];
        } else {
            carts[username][item] = quantity;
        }

        await writeJsonFile(CART_FILE, carts);
        console.log(`Updated cart for ${username}:`, carts[username]);
        res.json({ success: true, cart: carts[username] });
    } catch (err) {
        console.error('Error updating cart:', err);
        res.status(500).json({ success: false, message: 'Error updating cart' });
    }
});

async function readJsonFile(filePath) {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function startServer() {
    try {
        await initializeDataFiles();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Data directory: ${DATA_DIR}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();