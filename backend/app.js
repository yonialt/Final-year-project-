const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth.routes');
const resourceRoutes = require('./src/routes/resource.routes');
const requestRoutes = require('./src/routes/request.routes');
const damageReportRoutes = require('./src/routes/damageReport.routes');
const maintenanceRoutes = require('./src/routes/maintenance.routes');
const pricingRoutes = require('./src/routes/pricing.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const adminRoutes = require('./src/routes/admin.routes');

const { errorHandler } = require('./src/middleware/error.middleware');

const app = express();

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', version: '3.0', service: 'SRMS-API' }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/resources', resourceRoutes);
app.use('/requests', requestRoutes);
app.use('/damage-reports', damageReportRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/prices', pricingRoutes);
app.use('/notifications', notificationRoutes);
app.use('/admin', adminRoutes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
