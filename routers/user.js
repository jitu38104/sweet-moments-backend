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

route.get("/all/:page", userController.allData);

route.post("/logout", userController.logout);

route.get("/lite/me/:id", userController.liteInfo);

route.post('/upload/img', [tokenAuth, upload], userController.userImageUpload);

route.post('/edit/info', tokenAuth, userController.userInfoEdit);

route.get('/follow/:otherId', tokenAuth, followController.follow);

route.get('/unfollow/:otherId', tokenAuth, followController.unfollow);

route.delete('/del', tokenAuth, userController.userDelete);

route.post('/varify', userController.mailVarify);

route.post('/password/reset', userController.resetPass);

module.exports = route;