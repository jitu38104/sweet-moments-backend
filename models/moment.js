const mongoose = require('mongoose');

const momentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date() },
    image_path: { type: String, required: true },
    comments: { type: Array, default: [] },
    meta: {
        likes: { type: Number, default: 0 },
        dislikes: { type: Number, default: 0 }
    }
});

const momentModel = mongoose.model('Moment', momentSchema);

module.exports = { momentModel, momentSchema }