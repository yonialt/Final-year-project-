const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const resourceRoutes = require('./routes/resource.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const pricingRoutes = require('./routes/pricing.routes');
const requestRoutes = require('./routes/request.routes');
const adminRoutes = require('./routes/admin.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '2.0', service: 'SRMS-API' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/resources', resourceRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/prices', pricingRoutes);
app.use('/requests', requestRoutes);
app.use('/admin', adminRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
