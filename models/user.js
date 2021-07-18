const findOrCreat = require("mongoose-findorcreate");
const mongoose = require("mongoose");
const { momentSchema } = require('./moment');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: new Date()
    },
    meta: {
        followers: {
            total: { type: Number, default: 0 },
            users: { type: Array, default: [] }
        },
        followings: {
            total: { type: Number, default: 0 },
            users: { type: Array, default: [] }
        }
    },    
    role: {
        type: String,
        default: "user"
    },
    moment_data: [momentSchema]
});

userSchema.plugin(findOrCreat);

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;