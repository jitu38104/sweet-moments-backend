const bcrypt = require('bcrypt');
const passport = require('passport');
const localStrategy = require('passport-local');
const userModel = require('../models/user');


const passportInit = () => {
    passport.use(new localStrategy({ usernameField: 'email' }, async(email, password, done) => {
        //username matching
        const loggedInUser = await userModel.findOne({ email: email });

        if(!loggedInUser) {
            return done(null, false, { msg: "no user with such username" });
        } else {
            //password matching
            bcrypt.compare(password, loggedInUser.password).then(match => {
                if(match) {
                    return done(null, loggedInUser, { msg: "Login Successfully!" });
                } else {
                    return done(null, false, { msg: "wrong password or username" });
                }                
            }).catch(err => {
                return done(null, false, { msg: err.message });
            });
        }
    }));

    //saving user Id into session
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    //fetching user detail after getting Id from session
    passport.deserializeUser(async(id, done) => {
        await userModel.findById(id, (err, doc) => {
            done(err, doc);
        });
    });
}

module.exports = passportInit;