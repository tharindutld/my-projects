const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function check() {
  const connectionDetails = {
    host: 'localhost',
    user: 'root',
    password: ''
  };

  try {
    const conn = await mysql.createConnection(connectionDetails);
    console.log('Connected to MySQL server successfully!');
    
    const [dbs] = await conn.query('SHOW DATABASES');
    console.log('Available databases:');
    dbs.forEach(db => console.log(` - ${db.Database}`));

    await conn.end();
  } catch (err) {
    console.error('Failed to connect to MySQL:', err);
  }
}

check();
