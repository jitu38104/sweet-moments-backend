const express = require('express');
const multer = require('multer');
const userAuth = require('../middlewares/userAuth');
const tokenAuth = require('../middlewares/tokenAuth');
const multerMiddleware = require('../config/multer');
const { momentController } = require('../controllers/index');

const route = express.Router();

route.use(userAuth);

let upload = multerMiddleware(multer);

route.get('/user/moments', tokenAuth, momentController.userMoment);

route.get('/all/moments', momentController.allMoment);

route.post('/upload/img', upload, momentController.addMoment);

route.patch('/edit/:id', momentController.momentEdit);

route.get('/like/:otherUserId/:momentId', momentController.like);

route.get('/dislike/:otherUserId/:momentId', momentController.dislike);

route.post('/add/comment/:momentId', momentController.addComment);

route.delete('/delete/:id', momentController.momentDelete);

module.exports = route;