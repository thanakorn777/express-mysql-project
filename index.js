require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const db = require('./db');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { error } = require('console');

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

// ✅ Middleware ป้องกันสิทธิ์ตาม role
function requireRole(role) {
  return function (req, res, next) {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).send('🚫 Access denied');
    }
    next();
  };
}

// ✅ หน้า dashboard สำหรับ admin เท่านั้น
app.get('/dashboard_information.html', requireLogin, requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard_information.html'));
});

app.get('/dashboard_report.html', requireLogin, requireRole('admin'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard_report.html'));
});

// ✅ หน้า report_issue สำหรับ user เท่านั้น
app.get('/user_main.html', requireLogin, requireRole('user'), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user_main.html'));
});

// ✅ หน้า login เป็นหน้าแรก
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Login (ปรับปรุงเวอร์ชันทำงานแน่นอน)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    const user = rows[0];

    const match = await bcrypt.compare(password.trim(), user.password);

    if (!match) {
      return res.status(401).send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    // ✅ เพิ่ม role เข้า session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role  // <<==== ใส่ตรงนี้
    };

    // 👉 เปลี่ยนเส้นทางตาม role
    if (user.role === 'admin') {
      res.redirect('/dashboard_information.html');
    } else {
      res.redirect('user_main.html');
    }

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
      [email, hashedPassword]
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
app.delete('/dashboard_information/:id', async (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM dashboard_information WHERE id = ?';

  try {
    const [result] = await db.query(sql, [id]);
    console.log('✅ Deleted ID:', id);
    res.status(200).send('Deleted');
  } catch (err) {
    console.error('❌ Error deleting data:', err);
    res.status(500).send('Error deleting data');
  }
});

// ✅ อัปเดตข้อมูล
app.put('/dashboard_information/:id', async (req, res) => {
  const id = req.params.id;
  const { floor, department, ip_address, device, tel, note } = req.body;

  console.log('📦 Data received for update:', req.body);

  const sql = `
    UPDATE dashboard_information
    SET floor = ?, department = ?, ip_address = ?, device = ?, tel = ?, note = ?
    WHERE id = ?
  `;
  const values = [floor, department, ip_address, device, tel, note, id];

  try {
    const [result] = await db.query(sql, values); // ใช้ async/await
    console.log('🔄 Update result:', result);
    res.status(200).send('Updated');
  } catch (err) {
    console.error('🔥 Error updating data:', err);
    res.status(500).send('Error updating data');
  }
});

// ✅ API Endpoint /report_issue
app.post('/report_issue', async (req, res) => {
  const { name, department, ip_address, tel, note, status } = req.body;
  
  // 🐞 debug ตรงนี้เลย
  console.log('👉 Session user role:', req.session.user?.role);
  
    try {
      await db.query(
        'INSERT INTO dashboard_report (name, department, ip_address, tel, note, status) VALUES (?, ?, ?, ?, ?, ?)',
        [name, department, ip_address, tel, note, status]
      );
  
      // ✅ redirect ตาม role ของผู้ใช้
      const userRole = req.session.user?.role;
  
      if (userRole === 'admin') {
        res.redirect('/dashboard_report.html');
      } else {
        res.redirect('/user_main.html');
      }
  
    } catch (err) {
      console.error('❌ Error saving report issue:', err);
      res.status(500).send('Error saving report');
    }
  });

// ✅ API สำหรับดึงข้อมูลไปแสดงใน dashboard_report.html
app.get('/api/dashboard_report', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dashboard_report ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching dashboard report:', err);
    res.status(500).send('Error fetching report');
  }
});

// ✅ ลบข้อมูลจาก dashboard_report
app.delete('/dashboard_report/:id', async (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM dashboard_report WHERE id = ?';

  try {
    const [result] = await db.query(sql, [id]);
    console.log('✅ Deleted ID:', id);
    res.status(200).send('Deleted');
  } catch (err) {
    console.error('❌ Error deleting report:', err);
    res.status(500).send('Error deleting report');
  }
});

// ✅ Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
