const mongoose = require('mongoose');

const momentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    createdAt: { type: Date, default: Date() },
    image_path: { type: String, required: true, get: (image) => {
        return `${process.env.APP_URL}/${image}`;
    } },
    comments: { type: Array, default: [] },
    meta: {
        likes: { type: Number, default: 0 },
        dislikes: { type: Number, default: 0 }
    }
}, { toJSON: { getters: true } });

const momentModel = mongoose.model('Moment', momentSchema);

module.exports = { momentModel, momentSchema }