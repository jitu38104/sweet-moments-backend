const express = require('express');
const multer = require('multer');
const tokenAuth = require('../middlewares/tokenAuth');
const multerMiddleware = require('../config/multer');
const { momentController } = require('../controllers');

const route = express.Router();

let upload = multerMiddleware(multer);

route.get('/user/moments', tokenAuth, momentController.userMoment);

route.get('/all/moments', momentController.allMoment);

route.get('/one/moment/:id', momentController.oneMoment);

route.post('/upload/img', tokenAuth, upload, momentController.addMoment);

route.patch('/edit/:id', tokenAuth, momentController.momentEdit);

route.get('/like/:otherUserId/:momentId', tokenAuth, momentController.like);

route.get('/dislike/:otherUserId/:momentId', tokenAuth, momentController.dislike);

route.post('/add/comment', tokenAuth, momentController.addComment);

route.delete('/delete/:id', tokenAuth, momentController.momentDelete);

////////////////stripe payment route////////////////////
route.post("/payment/create", momentController.stripePayment);

module.exports = route;