const fs = require('fs');
const joi = require('joi'); 
const path = require('path');
const bcrypt = require('bcrypt');
const passport = require('passport');
const mail = require('../../services/mail');
const userModel = require('../../models/user');
const tokenModel = require('../../models/token');
const JwtService = require('../../services/JwtService');
const mailTemplate = require('../../services/mailTemplate');
const { docFinder, docDeleter } = require('../../utils/database');
const customErrorHandler = require('../../services/CustomErrorHandler');
const { deleteFolderRecursive: fileUnlink } = require('../../utils/fileRem');

const saltRounds = 10;

const userController = {
    test(req, res, next){
        console.log(req);
        console.log("Body: ", req.body);
        console.log("File: ", req.file);
        res.json({body: req.body, file: req.file });
    },

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
                    
                    const payload = {
                        _id: newUser._id,
                        role: newUser.role
                    };

                    const token = JwtService.sign(payload);

                    try {
                        tokenModel.create({access_token: token}, (err) => {
                            if(err) return next(err);
                        });
                    } catch (error) {
                        return next(error);
                    }

                    return res.status(200).json( { access_token: token } );
                } else {
                    return next(customErrorHandler.alreadyExist("This email is already in use, choose another."));
                }
            });
        });
    },
    
    async login(req, res, next){  
        if(!req.body.email || !req.body.password) {
            return res.status(401).json({ message: "missing credentials" });
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
                return next(customErrorHandler.forbiddenError());                
            }

            req.logIn(user, (err) => {
                if(err) {
                    return next(err);
                }
                
                const payload = {
                    _id: user._id,
                    role: user.role
                }

                const token = JwtService.sign(payload);

                try {
                    tokenModel.create({access_token: token}, (err) => {
                        if(err) return next(err);
                    });
                } catch (error) {
                    return next(error);
                }

                return res.status(200).json({ access_token: token });
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

    async allData(req, res, next) {
        const page = req.params.page;
        try {
            const allUser = await userModel.find({});
            if(page === 'admin') {
                return res.status(200).json(allUser);
            }
            const emailArr = [];
            allUser.forEach(doc => {
                emailArr.push(doc?.email);
            });

            return res.status(200).json(emailArr);                        
        } catch(err) {
            return next(err);
        }
    },

    logout(req, res, next) {
        try {
            req.logOut();
            
            tokenModel.deleteOne({ access_token: req.body.token }, (err, doc) => {
                if(err) return next(err);

                if(!doc.deletedCount) {
                    return next(customErrorHandler.authenticationError("Token is invalid"));
                } else {
                    res.status(200).json({
                        msg: "User logout successfully!",
                        flag: 1 
                    });
                }                
            });                        
        } catch (error) {
            return next(error);
        }                  
    },

    async liteInfo(req, res, next){
        const params = req.params?.id;
        
        try {
            let user = {};
            
            if(params.includes('@')){
                user = await userModel.findOne({email: params});
            } else {
                user = await docFinder(userModel, params);
            }            

            const liteInfo = {
                id: user?._id,
                name: user?.name,
                email: user?.email,
                profession: user?.profession || 'unknown',
                img_path: `${process.env.APP_URL}/${user?.image_path}`,
                about: user?.about,
                followers: user?.meta?.followers,
                following: user?.meta?.followings,
                moments: { moment: user?.moment_data, total: user?.moment_data.length }
            };

            return res.status(200).json(liteInfo);
        } catch(error) {
            return next(error);
        }  
    },

    async userImageUpload (req, res, next) {        
        const userId = req.user?._id;
        try {
            const user = await docFinder(userModel, userId);
            const imgPath = user?.image_path;

            if(!imgPath.includes('avatar')) {
                fs.unlinkSync(user?.image_path);
            }            

            user.image_path = req.file?.path;
            await user.save(err => {
                if(err) {
                    fs.unlinkSync(req.file.path);
                    return next(err);
                }
                res.status(200).json({
                    message: "successfully uploaded!",
                    path: req.file?.path
                })                
            });
        } catch (error) {
            fs.unlinkSync(req.file.path);
            return next(error);
        }                
    },

    async userInfoEdit (req, res, next) {
        const userId = req.user?._id;       

        const { name, about, profession } = req.body;          

        const user = await docFinder(userModel, userId);

        user.name = name;
        user.about = about;
        user.profession = profession;

        await user.save(err => {
            !err
            ? res.status(200).json({ 
                message: "Information updated successfully!",
                updated: user
            })
            : next(err);
        });
    },

    async userDelete (req, res, next) {
        const userId = req.query?.user_id;
        
        docDeleter(userModel, userId, next).then(result => {
            fileUnlink(path.join('uploads', `${result._id}`));
            res.status(200).json({ 
                message: "User has been deleted!",
                flag: 1
            });
        }).catch(err => {
            return next(err);
        });
    },

    async mailVarify (req, res, next) {
        const email = req.body?.email;
        const mailFrom = process.env.MAIL_USER;

        try {
            const user = await userModel.findOne({email: email});
            
            if(user) {
                const link = `${process.env.RESET_URL}?email=${email}`;
                console.log(link);
                const options = {
                    from: `Sweet-Moments Admin <${mailFrom}>`, 
                    to: email, 
                    sub: "Password Reset Request Approval", 
                    txt: "Click on the given link to redirect Reset Password page", 
                    html: mailTemplate(mailFrom, link)
                }

                mail(options, next).then(() => {
                    return res.status(200).json({ message: "Email has been sent. Check your email." });
                }).catch(err => {
                    return next(err);
                });                
            } else {
                return res.status(200).json({ message: "Email is invalid" });   
            }            
        } catch (error) {
            next(error);    
        }        
    },

    async resetPass (req, res, next) {
        const { password, email } = req.body;

        const passSchema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required()
        });

        const { error } = passSchema.validate(req.body);

        if(error) {
            return next(error);
        }
        
        bcrypt.hash(password, saltRounds).then(hashed => {
            try {
                userModel.updateOne({email: email}, {
                    $set: { password: hashed }
                }, (err) => {
                    if(!err) {
                        return res.status(200).json({ 
                            message: "Password successfully updated!",
                            flag: 1
                        });
                    } else { return next(err); }
                })    
            } catch (error) {
                next(error);
            }            
        }).catch(err => next(err));
    }
}

module.exports = userController;