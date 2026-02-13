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

// ===== ROUTES API =====

// Get all routes for user
app.get('/api/routes', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || !token.startsWith('demo-token-')) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  const userId = token.replace('demo-token-', '');
  const userRoutes = routes.filter(r => r.driverId === userId);
  
  res.json({ routes: userRoutes });
});

// Create new route
app.post('/api/routes', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || !token.startsWith('demo-token-')) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  const userId = token.replace('demo-token-', '');
  const { name, stops, startTime, notes } = req.body;

  const newRoute = {
    id: Date.now().toString(),
    driverId: userId,
    name: name || 'New Route',
    stops: stops || [],
    startTime: startTime || new Date(),
    notes: notes || '',
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  routes.push(newRoute);
  res.status(201).json({ message: 'Route created', route: newRoute });
});

// Update route status
app.patch('/api/routes/:id/status', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || !token.startsWith('demo-token-')) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  const userId = token.replace('demo-token-', '');
  const { status } = req.body;
  
  const route = routes.find(r => r.id === req.params.id && r.driverId === userId);
  
  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }

  route.status = status;
  route.updatedAt = new Date();

  res.json({ message: 'Route updated', route });
});

// ===== DRIVERS API =====

// Get driver stats
app.get('/api/drivers/stats', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token || !token.startsWith('demo-token-')) {
    return res.status(401).json({ error: 'Access denied' });
  }
  
  const userId = token.replace('demo-token-', '');
  const driverRoutes = routes.filter(r => r.driverId === userId);
  
  const stats = {
    totalRoutes: driverRoutes.length,
    completedRoutes: driverRoutes.filter(r => r.status === 'completed').length,
    totalStops: driverRoutes.reduce((acc, r) => acc + (r.stops?.length || 0), 0),
    completedStops: driverRoutes.reduce((acc, r) => {
      return acc + (r.stops?.filter(s => s.status === 'visited')?.length || 0);
    }, 0)
  };

  res.json({ stats });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'RouteFlow AI API is running',
    users: users.length,
    routes: routes.length
  });
});

// Serve landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
n});

// Driver app
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'driver-app-v2.html'));
});

// Admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`RouteFlow AI server running on port ${PORT}`);
  console.log(`Website: http://localhost:${PORT}`);
  console.log(`Driver app: http://localhost:${PORT}/app`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
