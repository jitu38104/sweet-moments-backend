const fs = require('fs');
const joi = require('joi'); 
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const userModel = require('../../models/user');
const { docFinder, docDeleter } = require('../../utils/database');
const { deleteFolderRecursive: fileUnlink } = require('../../utils/fileRem');
const customErrorHandler = require('../../services/CustomErrorHandler');
const JwtService = require('../../services/JwtService');

const saltRounds = 10;

const userController = {
    async regiter(req, res, next) {   
        const registerSchema = joi.object({
            name: joi.string().min(3).max(30).required(),
            email: joi.string().email().required(),
            password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required(),
            repeat_password: joi.ref("password")
        }); 

        const { error } = registerSchema.validate(req.body);

        if(error) {           
            return next(error);
        }
        
        const { name, email, password } = req.body;
        bcrypt.hash(password, saltRounds).then(async(hash) => {
            const newUser = new userModel({ name, email, password: hash });
            await newUser.save(err => {
                if(!err) {
                    fs.mkdirSync(path.join('uploads', `${newUser._id}`));
                    res.status(200).json(newUser);
                } else {
                    return next(customErrorHandler.alreadyExist("This email is already in use, choose another."));
                }
            });
        });
    },
    
    async login(req, res, next){  
        if(!req.body.email || !req.body.password) {
            return res.status(401).json({message: "missing credentials"});
        }

        const loginSchema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required()
        });

        const { error } = loginSchema.validate(req.body);

        if(error) {
            return next(error);
        }
        
        passport.authenticate('local', (err, user, info) => {
            if(err) {
                return next(err);
            }

            if(!user) {
                return next(err);
                
            }
            req.logIn(user, (err) => {
                if(err) {
                    return next(err);
                }
                req.session.user = user;
                const payload = {
                    _id: user._id,
                    role: user.role
                }

                const token = JwtService.sign(payload);

                return res.status(200).json({access_token: token});
            })
        })(req, res, next);
    },

    async whoAmI(req, res, next) {
        try {
            const userId = req.user._id
            const user = await userModel.findById(userId).select("-password -__v");

            if(!user) {
                return next(customErrorHandler.notFound());
            }

            res.status(200).json(user);
        } catch(err) {
            return next(err);
        }        
    },

    logout(req, res, next) {
        req.logOut();
        delete req.session.user;
        res.status(200).json({ msg: "User logout successfully!" });
    },

    async userImageUpload (req, res, next) {
        const userId = req.session?.user?._id;

        const user = await docFinder(userModel, userId);

        user.image_path = req.file?.path;
        await user.save(err => {
            !err 
            ? res.status(200).json({
                message: "successfully uploaded!",
                path: req.file?.path
            })
            : next(err);           
        });        
    },

    async userInfoEdit (req, res, next) {
        const userId = req.session?.user?._id;
        const { name, about } = req.body;

        const user = await docFinder(userModel, userId);

        user.name = name;
        user.about = about;

        await user.save(err => {
            !err
            ? res.status(200).json({ message: "Information updated successfully!" })
            : next(err);
        });
    },

    async userDelete (req, res) {
        const userId = req.session?.user?._id;

        docDeleter(userModel, userId).then(result => {
            fileUnlink(path.join('uploads', `${result._id}`));
            res.status(200).json({ message: "User has been deleted!" });
        }).catch(err => {
            return next(err);            
        });
    }
}

module.exports = userController;