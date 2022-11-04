const mongoose = require('mongoose');
const ChannelSchema = new mongoose.Schema({
  type: { type: String, required: true },
  url: { type: String, required: true },
});
module.exports = mongoose.model('Channel', ChannelSchema);
