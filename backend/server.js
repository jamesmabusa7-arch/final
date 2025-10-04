const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ==================== DATABASE CONFIGURATION ====================
const dbConfig = {
  host: process.env.DB_HOST || 'sql8.freesqldatabase.com',
  user: process.env.DB_USER || 'sql8801237', // Your new database username
  password: process.env.DB_PASSWORD || 'sHsd1LGKzF', // Your new database password
  database: process.env.DB_NAME || 'sql8801237', // Your new database name
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool for better performance
const pool = mysql.createPool(dbConfig);

// Test database connection on startup
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Database connected successfully');
    conn.release();
    
    // Initialize database tables if they don't exist
    await initializeDatabase();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Please check your database credentials and ensure freesqldatabase.com is accessible');
  }
}

// Initialize database tables
async function initializeDatabase() {
  try {
    // Users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'lecturer', 'pl', 'prl') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Courses table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) UNIQUE NOT NULL,
        lecturer_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Reports table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        faculty VARCHAR(255),
        class_name VARCHAR(255),
        week_of_reporting VARCHAR(100),
        date_of_lecture DATE,
        course_name VARCHAR(255),
        course_code VARCHAR(100),
        lecturer_name VARCHAR(255),
        actual_present INT,
        total_registered INT,
        venue VARCHAR(255),
        scheduled_time TIME,
        topic_taught TEXT,
        learning_outcomes TEXT,
        recommendations TEXT,
        prl_feedback TEXT,
        pl_feedback TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Ratings table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        student_id INT NOT NULL,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Feedback table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        report_id INT NOT NULL,
        student_id INT,
        feedback TEXT NOT NULL,
        topic VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
  }
}

// ==================== MIDDLEWARE ====================
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey"; // Use environment variable

// JWT verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// ==================== AUTHENTICATION ROUTES ====================

// Register
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  
  if (!username || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!['student', 'lecturer', 'pl', 'prl'].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role]
    );
    
    res.status(201).json({ 
      message: "User registered successfully",
      userId: result.insertId 
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Username already exists" });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Database error during registration" });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?', 
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        username: user.username 
      }, 
      JWT_SECRET, 
      { expiresIn: "24h" }
    );

    res.json({ 
      message: "Login successful", 
      token, 
      role: user.role, 
      userId: user.id,
      username: user.username
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Database error during login" });
  }
});

// ==================== REPORTS ROUTES ====================

// Create report
app.post('/api/reports', authenticateToken, async (req, res) => {
  const data = req.body;
  
  try {
    const sql = `INSERT INTO reports
      (faculty, class_name, week_of_reporting, date_of_lecture, course_name, 
       course_code, lecturer_name, actual_present, total_registered, venue, 
       scheduled_time, topic_taught, learning_outcomes, recommendations, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      data.faculty, data.className, data.weekOfReporting, data.dateOfLecture,
      data.courseName, data.courseCode, data.lecturerName, data.actualPresent,
      data.totalRegistered, data.venue, data.scheduledTime, data.topicTaught,
      data.learningOutcomes, data.recommendations, req.user.id
    ];

    const [result] = await pool.execute(sql, params);
    
    res.status(201).json({ 
      message: 'Report saved successfully',
      reportId: result.insertId 
    });
  } catch (err) {
    console.error('Report creation error:', err);
    res.status(500).json({ error: 'Database error while saving report' });
  }
});

// Get all reports
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.username as created_by_name 
       FROM reports r 
       LEFT JOIN users u ON r.created_by = u.id 
       ORDER BY r.date_of_lecture DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error('Reports fetch error:', err);
    res.status(500).json({ error: 'Database error while fetching reports' });
  }
});

// Get single report
app.get('/api/reports/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, u.username as created_by_name 
       FROM reports r 
       LEFT JOIN users u ON r.created_by = u.id 
       WHERE r.id = ?`,
      [req.params.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Report fetch error:', err);
    res.status(500).json({ error: 'Database error while fetching report' });
  }
});

// PRL feedback on report
app.post('/api/reports/:id/feedback', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;
  
  if (req.user.role !== 'prl') {
    return res.status(403).json({ error: 'Only PRL can add feedback' });
  }

  try {
    await pool.execute(
      'UPDATE reports SET prl_feedback = ? WHERE id = ?', 
      [feedback, id]
    );
    res.json({ message: 'PRL feedback saved successfully' });
  } catch (err) {
    console.error('PRL feedback error:', err);
    res.status(500).json({ error: 'Database error while saving feedback' });
  }
});

// PL feedback on report
app.post('/api/reports/:id/pl-feedback', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { feedback } = req.body;
  
  if (req.user.role !== 'pl') {
    return res.status(403).json({ error: 'Only PL can add feedback' });
  }

  try {
    await pool.execute(
      'UPDATE reports SET pl_feedback = ? WHERE id = ?', 
      [feedback, id]
    );
    res.json({ message: 'PL feedback saved successfully' });
  } catch (err) {
    console.error('PL feedback error:', err);
    res.status(500).json({ error: 'Database error while saving PL feedback' });
  }
});

// ==================== RATINGS ROUTES ====================

app.post('/api/ratings', authenticateToken, async (req, res) => {
  const { reportId, rating, feedback } = req.body;
  const studentId = req.user.id;

  if (!reportId) {
    return res.status(400).json({ error: 'Report ID is required' });
  }

  try {
    // Check if user already rated this report
    const [existing] = await pool.execute(
      'SELECT id FROM ratings WHERE report_id = ? AND student_id = ?',
      [reportId, studentId]
    );

    if (existing.length > 0) {
      // Update existing rating
      await pool.execute(
        'UPDATE ratings SET rating = ?, feedback = ? WHERE report_id = ? AND student_id = ?',
        [rating, feedback, reportId, studentId]
      );
    } else {
      // Insert new rating
      await pool.execute(
        'INSERT INTO ratings (report_id, student_id, rating, feedback) VALUES (?, ?, ?, ?)',
        [reportId, studentId, rating, feedback]
      );
    }

    res.status(201).json({ message: 'Rating saved successfully' });
  } catch (err) {
    console.error('Ratings error:', err);
    res.status(500).json({ error: 'Database error while saving rating' });
  }
});

app.get('/api/ratings', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.id, r.report_id, r.student_id, r.rating, r.feedback, 
              u.username AS student_name, rep.course_name
       FROM ratings r
       JOIN users u ON r.student_id = u.id
       JOIN reports rep ON r.report_id = rep.id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Ratings fetch error:', err);
    res.status(500).json({ error: 'Database error while fetching ratings' });
  }
});

// ==================== COURSES ROUTES ====================

app.post('/api/courses', authenticateToken, async (req, res) => {
  const { name, code, lecturerId } = req.body;
  
  try {
    const [result] = await pool.execute(
      'INSERT INTO courses (name, code, lecturer_id) VALUES (?, ?, ?)',
      [name, code, lecturerId || null]
    );
    
    const [rows] = await pool.execute(
      'SELECT c.*, u.username as lecturer_name FROM courses c LEFT JOIN users u ON c.lecturer_id = u.id WHERE c.id = ?', 
      [result.insertId]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    console.error('Course creation error:', err);
    res.status(500).json({ error: 'Database error while creating course' });
  }
});

app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.*, u.username as lecturer_name 
       FROM courses c 
       LEFT JOIN users u ON c.lecturer_id = u.id 
       ORDER BY c.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Courses fetch error:', err);
    res.status(500).json({ error: 'Database error while fetching courses' });
  }
});

app.put('/api/courses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, code, lecturerId } = req.body;
  
  try {
    await pool.execute(
      'UPDATE courses SET name = ?, code = ?, lecturer_id = ? WHERE id = ?',
      [name, code, lecturerId || null, id]
    );
    res.json({ message: 'Course updated successfully' });
  } catch (err) {
    console.error('Course update error:', err);
    res.status(500).json({ error: 'Database error while updating course' });
  }
});

app.delete('/api/courses/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.execute('DELETE FROM courses WHERE id = ?', [id]);
    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Course delete error:', err);
    res.status(500).json({ error: 'Database error while deleting course' });
  }
});

// ==================== FEEDBACK ROUTES ====================

app.post('/api/feedback', authenticateToken, async (req, res) => {
  const { reportId, feedback, topic } = req.body;
  const studentId = req.user.id;

  if (!reportId || !feedback) {
    return res.status(400).json({ error: 'Report ID and feedback are required' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id FROM feedback WHERE report_id = ? AND student_id = ?',
      [reportId, studentId]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE feedback SET feedback = ?, topic = ? WHERE report_id = ? AND student_id = ?',
        [feedback, topic, reportId, studentId]
      );
    } else {
      await pool.execute(
        'INSERT INTO feedback (report_id, student_id, feedback, topic) VALUES (?, ?, ?, ?)',
        [reportId, studentId, feedback, topic]
      );
    }
    
    res.status(201).json({ message: 'Feedback saved successfully' });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: 'Database error while saving feedback' });
  }
});

app.get('/api/feedback/:reportId', authenticateToken, async (req, res) => {
  const { reportId } = req.params;
  
  try {
    const [rows] = await pool.execute(
      `SELECT f.*, u.username as student_name 
       FROM feedback f 
       JOIN users u ON f.student_id = u.id 
       WHERE f.report_id = ?`,
      [reportId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Feedback fetch error:', err);
    res.status(500).json({ error: 'Database error while fetching feedback' });
  }
});

// ==================== USERS ROUTES ====================

app.get('/api/users', authenticateToken, async (req, res) => {
  const { role } = req.query;
  
  try {
    let sql = `SELECT id, username, role, created_at 
               FROM users`;
    const params = [];
    
    if (role) {
      sql += ' WHERE role = ?';
      params.push(role);
    }
    
    sql += ' ORDER BY username ASC';
    
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Users fetch error:', err);
    res.status(500).json({ error: 'Database error while fetching users' });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'Error', 
      database: 'Disconnected',
      error: err.message 
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'LUCT Reporting API is running!',
    version: '1.0.0',
    database: dbConfig.database,
    timestamp: new Date().toISOString()
  });
});

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: ${dbConfig.database}`);
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Test database connection
  await testConnection();
});