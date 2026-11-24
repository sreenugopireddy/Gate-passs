require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const gatepassRoutes = require('./routes/gatepass');
const hodRoutes = require('./routes/hod');
const securityRoutes = require('./routes/security');
const adminRoutes = require('./routes/admin');
const { initEmailJS } = require('./config/emailjs');

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use('/uploads', express.static('uploads'));

// basic rate limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);
initEmailJS();
// connect database
connectDB();

app.get('/', (req, res) => res.send('Gatepass API running'));
app.use('/api/auth', authRoutes);
app.use('/api/gatepass', gatepassRoutes);
app.use('/api/hod', hodRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// attach socket.io for real-time notifications
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

io.on('connection', (socket) => {
	console.log('socket connected', socket.id);
	socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

module.exports = server;
