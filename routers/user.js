const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const userModel = require("../models/user");
const passportInit = require("../config/passport");
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const userAuth = require('../config/middleware');
const multerMiddleware = require('../config/multer');
const { docFinder, docDeleter } = require('../utils/database');
const { deleteFolderRecursive: fileUnlink } = require('../utils/fileRem');

const route = express.Router();
const saltRounds = 10;

passportInit();

route.use(passport.initialize());
route.use(passport.session());

let upload = multerMiddleware(multer);

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

    const user = await docFinder(userModel, userId);

    user.image_path = req.file?.path;
    user.save(err => {
        !err 
        ? res.status(200).json({
            message: "successfully uploaded!",
            path: req.file?.path
        })
        : res.status(500).json({ message: err.message });
    });        
});

route.post('/edit/info', userAuth, async(req, res) => {
    const userId = req.session?.user?._id;
    const { name, about } = req.body;

    const user = await docFinder(userModel, userId);

    user.name = name;
    user.about = about;

    user.save(err => {
        !err
        ? res.status(200).json({ message: "Information updated successfully!" })
        : res.status(500).json({ message: err.message });
    });
});

route.delete('/del', userAuth, async(req, res) => {
    const userId = req.session?.user?._id;

    docDeleter(userModel, userId).then(result => {
        fileUnlink(path.join('uploads', `${result._id}`));
        res.status(200).json({ message: "User has been deleted!" });
    }).catch(err => {
        res.status(500).json({ message: err.message });
    });
    
});

module.exports = route;