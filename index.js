require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const db = require('./db');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // ✅ static ต้องมาก่อน route

// Connect MySQL
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

connection.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// ✅ หน้า login เป็นหน้าแรก
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Routes สำหรับ user
app.get('/user', (req, res) => res.send('GET user'));
app.put('/user', (req, res) => res.send('PUT user'));
app.patch('/user', (req, res) => res.send('PATCH user'));
app.delete('/user', (req, res) => res.send('DELETE user'));

// ✅ POST user พร้อมบันทึกลง MySQL
app.post('/user', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    res.status(201).send('User created');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving user');
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:3000`);
});
