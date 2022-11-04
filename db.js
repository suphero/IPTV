const mongoose = require('mongoose');
const config = require('./config');
const connection = {}

module.exports = async () => {
  if (connection.isConnected) {
    console.log('=> using existing database connection');
    return;
  }

  console.log('=> using new database connection');
  const db = await mongoose.connect(config.DB_URL);
  connection.isConnected = db.connections[0].readyState;
}
