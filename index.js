const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./config');
const { pool } = require('./database/db');
const { ok } = require('./utils/response');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { dashboardPage } = require('./views/dashboard');
const { memberLiffPage, staffLiffPage } = require('./views/liff');

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true, credentials: false }));
app.get('/health', (req, res) => ok(res, { status: 'ok', environment: config.env }, 'Healthy'));
app.get('/ready', async (req, res, next) => { try { await pool.query('SELECT 1'); return ok(res, { database: 'connected' }, 'Ready'); } catch (error) { return next(error); } });
app.use('/webhook', require('./routes/webhookRoutes'));
app.use(express.json({ limit: '1mb' }));
app.use('/api', apiLimiter);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/member', require('./routes/memberRoutes'));
app.use('/api/stamp', require('./routes/stampRoutes'));
app.use('/api/coupon', require('./routes/couponRoutes'));
app.use('/api/promotion', require('./routes/promotionRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/line', require('./routes/lineAdminRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/knowledge', require('./routes/knowledgeRoutes'));
app.get('/dashboard', (req, res) => res.type('html').send(dashboardPage()));
app.get('/liff/member', (req, res) => res.type('html').send(memberLiffPage(config.liff.memberId)));
app.get('/liff/staff', (req, res) => res.type('html').send(staffLiffPage(config.liff.staffId)));

app.use('/pic', express.static(path.join(__dirname, 'pic')));


app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(config.port, () => console.log(`Grandfa Cafe API listening on port ${config.port}`));
  function shutdown(signal) { console.log(`${signal} received; closing server`); server.close(() => pool.end().finally(() => process.exit(0))); setTimeout(() => process.exit(1), 10000).unref(); }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
module.exports = app;
