require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const branchRoutes = require('./routes/branchRoutes');
const feeRoutes = require('./routes/feeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const markRoutes = require('./routes/markRoutes');

const app = express();

// Connect to Database
connectDB();

// Middleware — allow all origins
app.use(cors());
app.options('*', cors()); // pre-flight for all routes
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/marks', markRoutes);

// Health Check
app.get('/', (req, res) => res.json({ message: 'College ERP API Running ✅' }));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
