const mysql = require('mysql2/promise');

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',       // XAMPP MySQL host
  user: 'root',            // default XAMPP MySQL user
  password: '',            // default XAMPP MySQL password (empty string)
  database: 'login_details' // the database you created in phpMyAdmin
});

module.exports = pool;

