const express = require('express');
const multer = require('multer');
const userAuth = require('../middlewares/userAuth');
const multerMiddleware = require('../config/multer');
const tokenAuth = require('../middlewares/tokenAuth');
const { userController, followController } = require('../controllers/index');

const route = express.Router();

let upload = multerMiddleware(multer);


route.post('/register', userController.regiter);

route.post("/login", userController.login);

route.get('/me', tokenAuth, userController.whoAmI);

route.get("/logout", userController.logout);

route.post('/upload/img', [userAuth, upload], userController.userImageUpload);

route.post('/edit/info', userAuth, userController.userInfoEdit);

route.get('/follow/:otherId', userAuth, followController.follow);

route.get('/unfollow/:otherId', userAuth, followController.unfollow);

route.delete('/del', userAuth, userController.userDelete);


module.exports = route;