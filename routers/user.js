const express = require('express');
const multer = require('multer');
const multerMiddleware = require('../config/multer');
const tokenAuth = require('../middlewares/tokenAuth');
const { userController, followController } = require('../controllers');

const route = express.Router();

let upload = multerMiddleware(multer);


route.post('/register', userController.regiter);

route.post("/login", userController.login);

route.get('/me', tokenAuth, userController.whoAmI);

route.post("/logout", userController.logout);

route.post('/upload/img', [tokenAuth, upload], userController.userImageUpload);

route.post('/edit/info', tokenAuth, userController.userInfoEdit);

route.get('/follow/:otherId', tokenAuth, followController.follow);

route.get('/unfollow/:otherId', tokenAuth, followController.unfollow);

route.delete('/del', userController.userDelete);


module.exports = route;