const userModel = require("../../models/user");
const customErrorHandler = require("../../services/CustomErrorHandler");
const { docFinder } = require("../../utils/database");

const userFollowController = {
    async follow (req, res, next) {
        const otherUserId = req.params.otherId;
        const currentUserId = req.user?._id;
        try {
            userModel.updateOne({ _id: otherUserId }, {
                    $inc: {"meta.followers.total": 1},
                    $addToSet: {"meta.followers.users": currentUserId}
                }, (err) => {
                if(err) return next(err);
            });

            userModel.updateOne({ _id: currentUserId }, {
                $inc: { "meta.followings.total": 1 },
                $addToSet: { "meta.followings.users": otherUserId }
            }, (err) => {
                if(err) return next(err);
            });
        } catch (error) {
            return next(error);
        }       

        res.status(200).json({ message: `You have followed ${otherUserId}` });
    },

    async unfollow (req, res, next) {
        const otherUserId = req.params.otherId;
        const userId = req.user?._id;

        try {
            const otherUser = await docFinder(userModel, otherUserId);
            const currentUser = await docFinder(userModel, userId);

            if(!otherUser || !currentUser) {
                return next(customErrorHandler.notFound("User is not defined"));            
            }

            if(otherUser?.meta?.followers?.total > 0 && currentUser?.meta?.followings?.total > 0) {
                userModel.findByIdAndUpdate(otherUserId, {
                    $inc: { "meta.followers.total": -1 },
                    $pull: { "meta.followers.users": userId }
                }, (err) => {
                    if(err) return next(err);
                });

                userModel.findByIdAndUpdate(userId, {
                    $inc: { "meta.followings.total": -1 },
                    $pull: { "meta.followings.users": otherUserId }
                }, (err) => {
                    if(err) return next(err);
                });
            } else {
                return next(customErrorHandler.mongooseError("User has zero total"));            
            }
        } catch (error) {
            return next(error);
        }          
        
        res.status(200).json({ message: `You have unfollowed ${otherUserId}` });
    }

}

module.exports = userFollowController;