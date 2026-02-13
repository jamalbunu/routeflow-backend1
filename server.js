const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock database
const users = [];
const routes = [];

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', (req, res) => {
  const { email, password, name, company } = req.body;

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }

  const user = {
    id: Date.now().toString(),
    email,
    password,
    name,
    company: company || '',
    role: 'driver',
    createdAt: new Date()
  };

  users.push(user);

  res.json({
    message: 'User registered successfully',
    token: 'demo-token-' + user.id,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role
    }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user || user.password !== password) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  res.json({
    message: 'Login successful',
    token: 'demo-token-' + user.id,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role
    }
  });
});

// Get current user
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || !token.startsWith('demo-token-')) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  const userId = token.replace('demo-token-', '');
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role
    }
  });
});
