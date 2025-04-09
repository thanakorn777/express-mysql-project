require('dotenv').config();
const mysql = require('mysql2');

// MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

const express = require('express'); 
const app = express();
const port = 3000;

// Middleware
app.use(express.json());

// Hello world route
app.get('/', (req, res) => {
  res.send('Hello World!');
});

// CRUD example routes
app.get('/item', (req, res) => res.send('GET item'));
app.post('/item', (req, res) => res.send('POST item'));
app.put('/item', (req, res) => res.send('PUT item'));
app.patch('/item', (req, res) => res.send('PATCH item'));
app.delete('/item', (req, res) => res.send('DELETE item'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:3000`);
});
