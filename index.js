require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET, // Use the secret from .env
  resave: false,
  saveUninitialized: false
}));

// MySQL connection
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

// ✅ Middleware ป้องกันหน้า login
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/');
  }
  next();
}

// ✅ หน้า login เป็นหน้าแรก
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ หน้า dashboard ต้อง login ก่อนเข้า
app.get('/dashboard_information.html', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard_information.html'));
});

// ✅ Login (ปรับปรุงเวอร์ชันทำงานแน่นอน)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('📥 ฟอร์มที่ได้รับ:');
  console.log('email:', `"${email}"`);
  console.log('password:', `"${password}"`);

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      console.log('❌ ไม่พบ email ในฐานข้อมูล');
      return res.status(401).send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    const user = rows[0];
    console.log('🔐 Hash ในฐานข้อมูล:', user.password);

    const match = await bcrypt.compare(password.trim(), user.password);
    console.log('🧪 bcrypt.compare:', match);

    if (!match) {
      console.log('❌ password ไม่ตรง');
      return res.status(401).send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    // ✅ Login สำเร็จ
    req.session.user = { id: user.id, email: user.email };
    console.log('✅ เข้าสู่ระบบสำเร็จ');
    res.redirect('/dashboard_information.html');
  } catch (err) {
    console.error('🔥 login error:', err);
    res.status(500).send('เกิดข้อผิดพลาดในระบบ');
  }
});

// ✅ Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ✅ API Users
app.get('/user', (req, res) => res.send('GET user'));
app.put('/user', (req, res) => res.send('PUT user'));
app.patch('/user', (req, res) => res.send('PATCH user'));
app.delete('/user', (req, res) => res.send('DELETE user'));

// ✅ สร้างผู้ใช้ใหม่ (เข้ารหัสรหัสผ่าน)
app.post('/user', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [username, email, hashedPassword]
    );
    res.status(201).send('User created');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving user');
  }
});

// ✅ Dashboard API
app.get('/dashboard_data', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dashboard_information ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching dashboard data');
  }
});

app.get('/dashboard_count', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT COUNT(*) as total FROM dashboard_information');
    res.json({ count: rows[0].total });
  } catch (err) {
    console.error('Error counting records:', err);
    res.status(500).send('Error counting records');
  }
});

// ✅ เพิ่มข้อมูล
app.post('/dashboard_information', async (req, res) => {
  const { floor, department, ip_address, device, tel, note } = req.body;
  try {
    await db.query(
      'INSERT INTO dashboard_information (floor, department, ip_address, device, tel, note) VALUES (?, ?, ?, ?, ?, ?)',
      [floor, department, ip_address, device, tel, note]
    );
    res.redirect('/dashboard_information.html');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving device');
  }
});

// ✅ ลบข้อมูล
app.delete('/dashboard_information/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM dashboard_information WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error deleting data:', err);
      return res.status(500).send('Error deleting data');
    }
    res.status(200).send('Deleted');
  });
});

// ✅ อัปเดตข้อมูล
app.put('/dashboard_information/:id', (req, res) => {
  const id = req.params.id;
  const { floor, department, ip_address, device, tel, note } = req.body;

  console.log('📦 Data received for update:', req.body);

  const sql = `
    UPDATE dashboard_information
    SET floor = ?, department = ?, ip_address = ?, device = ?, tel = ?, note = ?
    WHERE id = ?
  `;
  const values = [floor, department, ip_address, device, tel, note, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error updating data:', err);
      return res.status(500).send('Error updating data');
    }
    res.status(200).send('Updated');
  });
});

// ✅ Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
