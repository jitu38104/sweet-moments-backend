const fs = require('fs');
const { momentModel } = require('../../models/moment');
const userModel = require('../../models/user');
const { docFinder } = require('../../utils/database');
const customErrorHandler = require('../../services/CustomErrorHandler');

const momentController = {
    async userMoment (req, res, next) {
        try {
            const userId = req.user._id;        
            const user = await userModel.findById(userId);

            if(!user) {
                return next(customErrorHandler.notFound());
            }
            res.status(200).json({ moments: user.moment_data });
        } catch(error) {
            next(error);
        } 
    },

    async allMoment (req, res, next) {
        let momentsArr = [];
        try {
            const users = await userModel.find({}).sort({'_id': -1});

            users.forEach(doc => {
                momentsArr = [ ...momentsArr, ...doc.moment_data ];
            });

            res.status(200).json(momentsArr);   
        } catch (error) {
            return next(error);
        }       
    },

    async oneMoment (req, res, next) {
        try {
            const momentId = req.params?.id;
            const otherUserId = req.query?.user_id;
            
            userModel.findById(otherUserId, {
                moment_data: { $elemMatch: { _id: momentId } }
            }, ( err, doc ) => {
                !err
                ? res.status(200).json(doc.moment_data)
                : next(err);
            });
        } catch(error) {
            return next(error);
        }
    },

    async addMoment (req, res, next) {
        const userId = req.user?._id;
        try {
            let newMomentData;
            try{
                newMomentData = new momentModel({
                    title: req.body.title,
                    description: req.body.desc,
                    image_path: req.file.path
                });
            } catch(error) {
                fs.unlinkSync(req.file.path);
                return next(error);
            }

            const currentUser = await userModel.findById(userId);

            currentUser?.moment_data.push(newMomentData);
            await currentUser.save(err => {
                if(err) {
                    fs.unlinkSync(req.file.path);
                    return next(err);
                }  
                return res.status(200).json({ message: "Moment successfully uploaded!" });                           
            });
        } catch(error) {
            fs.unlinkSync(req.file.path);
            return next(error);
        }
    },

    async momentEdit (req, res, next) {
        const momentDataId = req.params.id;
        const userId = req.user?._id;

        const { title, desc } = req.body;

        try {
            userModel.findByIdAndUpdate(userId,{
                $set: { 
                    "moment_data.$[momentData].title": title,
                    "moment_data.$[momentData].description": desc
                 }
            },
            {"arrayFilters": [{ "momentData._id": momentDataId }]}
            ,(err) => {
                if(err) {
                    return next(err);                
                } else {
                    return res.status(200).json("Moment successfully updated!");
                }
            });
        } catch (error) {
            return next(error);
        }
    },

    like (req, res, next) {
        const currentUserId = req.user?._id;
        const otherUserId = req.params?.otherUserId;
        const momentId = req.params?.momentId;

        userModel.findByIdAndUpdate(otherUserId, {
            $inc: { "moment_data.$[momentData].meta.likes": 1 }
        },
        {"arrayFilters": [{ "momentData._id": momentId }]}
        , err => {
            if(err) return next(err);
        });

        userModel.findByIdAndUpdate(currentUserId, {
            $addToSet: { "meta.liked": momentId }
        }, err => {
            if(err) return next(err);
        });

        res.status(200).json({ message: `You have liked ${momentId}` });
    },

    async dislike (req, res, next) {
        const currentUserId = req.user?._id;
        const otherUserId = req.params?.otherUserId;
        const momentId = req.params?.momentId;
        const otherUserData = await docFinder(userModel, otherUserId);

        otherUserData?.moment_data.forEach(doc => {
            if(doc?._id == momentId) {
                if(doc?.meta?.likes <= 0) {
                    return next(customErrorHandler.mongooseError("Likes are already zero"));                    
                } else {
                    userModel.findByIdAndUpdate(otherUserId, {
                        $inc: { "moment_data.$[momentData].meta.likes": -1 }
                    },
                    { 
                        "arrayFilters": [{ "momentData._id": momentId }] 
                    }, err => {
                        if(err) return next(err);
                    });

                    userModel.findByIdAndUpdate(currentUserId, {
                        $pull: { "meta.liked": momentId }
                    }, err => {
                        if(err) return next(err);
                    });

                    res.status(200).json({ message: `You have disliked ${momentId}` });
                }
            }
        });    
    },

    addComment (req, res, next) {
        const userId = req.user?._id; 
        const { other_id, momentId, comment } = req.body;
        
        if(!userId || !other_id || !momentId) {
            return next(customErrorHandler.forbiddenError("Credentials are required!"));
        }

        const commentObj = {
            id: userId,
            comment: comment
        };

        userModel.findByIdAndUpdate(other_id, {
            $push: { "moment_data.$[momentData].comments": commentObj }
        },
        {
            "arrayFilters": [{ "momentData._id": momentId }]
        }, err => {
            if(err) return next(err);

            res.status(200).json({ message: "You have commented successfully!" });
        });        
    },

    async momentDelete (req, res, next) {
        const momentDataId = req.params.id;
        const userId = req.user?._id;
        let imgPath = "";
        
        try {
            await userModel.findById(userId, (err, doc) => {
                if(!err) {                    
                    const momentDocArr = doc.moment_data;
                    const momentData = momentDocArr.filter(doc => doc?._id == momentDataId);
                    imgPath = momentData[0]._doc.image_path;    //_doc is important to make getters disable                     
                    
                } else {
                    return next(err);
                }
            });
            
            await userModel.findByIdAndUpdate({ _id: userId }, { $pull: { moment_data: { _id: momentDataId }}}, (err) => {
                if(!err) {            
                    fs.unlink(imgPath, (err) => {
                        if(err) return next(err);
                    });
                    console.log("Data successfully deleted!")
                    res.status(200).json({ message: "Data successfully deleted!" });            
                } else {
                    return next(err);
                }                 
            });
        } catch (error) {
            return next(error);    
        }        
    }
}

module.exports = momentController;