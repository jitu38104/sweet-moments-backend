const express = require('express');
const fs = require('fs');
const multer = require('multer');
const userModel = require('../models/user');
const userAuth = require('../config/middleware');
const { momentModel } = require('../models/moment');
const multerMiddleware = require('../config/multer');
const { docFinder } = require('../utils/database');
const controller = require('../controllers/userController');

const route = express.Router();

let upload = multerMiddleware(multer);

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

route.patch('/edit/:id', userAuth, async(req, res) => {
    const momentDataId = req.params.id;
    const userId = req.session?.user?._id;
    const { title, desc } = req.query;

    await userModel.findById(userId, (err, doc) => {
        if(!err) {
            const momentDocArr = doc.moment_data;

            momentDocArr.forEach((item, i) => {
                if(item._id == momentDataId){
                    doc.moment_data[i].title = title;
                    doc.moment_data[i].description = desc;                    
                }
            });
            doc.save(err => {
                !err 
                ? res.status(200).json({message: 'Data has been updated!'})
                : res.status(500).json({message: err.message});
            });
        }
    })
});

route.get('/like/:otherUserId/:momentId', userAuth, (req, res) => {
    const currentUserId = req.query?.user_id;
    const otherUserId = req.params?.otherUserId;
    const momentId = req.params?.momentId;

    userModel.findByIdAndUpdate(otherUserId, {
        $inc: { "moment_data.$[momentData].meta.likes": 1 }
    },
    {"arrayFilters": [{ "momentData._id": momentId }]}
    , err => {
        if(err) return res.status(500).json({message: err.message});
    });

    userModel.findByIdAndUpdate(currentUserId, {
        $addToSet: { "meta.liked": momentId }
    }, err => {
        if(err) return res.status(500).json({message: err.message});
    });

    res.status(200).json({ message: `You have liked ${momentId}` });
});

route.get('/dislike/:otherUserId/:momentId', userAuth, async(req, res) => {
    const currentUserId = req.query?.user_id;
    const otherUserId = req.params?.otherUserId;
    const momentId = req.params?.momentId;
    const otherUserData = await docFinder(userModel, otherUserId);

    otherUserData?.moment_data.forEach(doc => {
        if(doc?._id == momentId) {
            if(doc?.meta?.likes <= 0) {
                return res.status(507).json({ message: "Likes are already zero" })
            } else {
                userModel.findByIdAndUpdate(otherUserId, {
                    $inc: { "moment_data.$[momentData].meta.likes": -1 }
                },
                { 
                    "arrayFilters": [{ "momentData._id": momentId }] 
                }, err => {
                    if(err) return res.status(500).json({message: err.message});
                });

                userModel.findByIdAndUpdate(currentUserId, {
                    $pull: { "meta.liked": momentId }
                }, err => {
                    if(err) return res.status(500).json({message: err.message});
                });

                res.status(200).json({ message: `You have disliked ${momentId}` });
            }
        }
    });    
});

route.post('/add/comment/:momentId', userAuth, (req, res) => {
    const { user_id, user_id2} = req.query;
    const momentId = req.params?.momentId;
    const userComment = req.body?.comment;

    const commentObj = {
        id: user_id,
        comment: userComment
    };

    userModel.findByIdAndUpdate(user_id2, {
        $push: { "moment_data.$[momentData].comments": commentObj }
    },
    {
        "arrayFilters": [{ "momentData._id": momentId }]
    }, err => {
        if(err) return res.status(500).json({ message: err.message });
    });

    res.status(200).json({ message: "You have commented successfully!" });
});

route.delete('/delete/:id', userAuth, async(req, res) => {
    const momentDataId = req.params.id;
    const userId = req.session.user?._id;
    let imgPath = "";
    
    await userModel.findById(userId, (err, doc) => {
        if(!err) {
            const momentDocArr = doc.moment_data;
            const momentData = momentDocArr.filter(doc => doc?._id == momentDataId);
            imgPath = momentData[0]?.image_path;
        }
    });
    
    await userModel.findByIdAndUpdate({ _id: userId }, { $pull: { moment_data: { _id: momentDataId }}}, (err) => {
        if(!err) {            
            fs.unlinkSync(imgPath);
            console.log("Data successfully deleted!")
            res.status(200).json({ message: "Data successfully deleted!" });            
        } else {
            res.status(501).json({ message: err.message });
        }                 
    });
});

module.exports = route;