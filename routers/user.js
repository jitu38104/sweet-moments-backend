const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const userModel = require("../models/user");
const passportInit = require("../config/passport");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const userAuth = require('../config/middleware');
const { momentModel } = require('../models/moment');

const route = express.Router();
const saltRounds = 10;

passportInit();

route.use(passport.initialize());
route.use(passport.session());

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.session?.user?._id;
        const location = path.join('uploads', `${userId}`);
        cb(null, location);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
    }
});

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function (req, file, cb) {
        let ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return cb(new Error('Only images are allowed'))
        }
        cb(null, true)
    },
    limits:{
        fileSize: 1024 * 1024 * 10
    }
}).single('uploadPic');


route.post('/register', async(req, res) => {    
    const { name, email, password } = req.body;
    bcrypt.hash(password, saltRounds).then(hash => {
        const newUser = new userModel({ name, email, password: hash });
        newUser.save(err => {
            if(!err) {
                fs.mkdirSync(path.join('uploads', `${newUser._id}`));
                res.status(200).json(newUser);
            } else {
                res.status(409).json({ message: "This email is already in use, choose another." });
            }
        });
    });   
});

route.post("/login", function(req, res, next){  
    if(!req.body.email || !req.body.password) {
        return res.status(401).json({message: "missing credentials"});
    }
    
    passport.authenticate('local', (err, user, info) => {
        if(err) {
            return res.status(500).json(info);
        }
        if(!user) {
            return res.status(401).json(info);
        }
        req.logIn(user, (err) => {
            if(err) {
                return res.status(404).json(err.message);
            }
            req.session.user = user;
            return res.status(200).json(info);
        })
    })(req, res, next);
});

route.get("/logout", (req, res) => {
    req.logOut();
    delete req.session.user;
    res.status(200).json({ msg: "User logout successfully!" });
});

route.post('/upload/img', [userAuth, upload], async(req, res) => {
    const userId = req.session?.user?._id;
    const newMomentData = new momentModel({
        title: req.body.title,
        description: req.body.desc,
        image_path: req.file.path
    });

    const currentUser = await userModel.findById(userId);
    currentUser?.moment_data.push(newMomentData);
    currentUser.save(err => {
        !err 
        ?   res.status(200).json({message: "Moment successfully uploaded!"}) 
        :   res.status(500).json({message: err.message})
    });
});


module.exports = route;