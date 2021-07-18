const mongoose = require('mongoose');

exports.momentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: String, default: Date() },
    image_path: { type: String, required: true },
    comments: { type: Array, default: [] },
    meta: {
        likes: { type: Number, default: 0 },
        dislikes: { type: Number, default: 0 }
    }
});

exports.momentModel = mongoose.model('Moment', this.momentSchema);