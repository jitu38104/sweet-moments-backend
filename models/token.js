const mongoose = require('mongoose');

const userTokenSchema = new mongoose.Schema({
    access_token: { type: String, required: true, unique: true }
});

const userTokenModel = mongoose.model('Token', userTokenSchema, 'userTokens');

module.exports = userTokenModel;