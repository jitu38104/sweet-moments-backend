const path = require('path');

const multerInit = (multer) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const userId = req.user?._id;
            const location = path.join('uploads', `${userId}`);
            cb(null, location);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
        }
    });

    const filter = function (req, file, cb) {
            let ext = path.extname(file.originalname);
            if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
                return cb(new Error('Only images are allowed'))
            }
            cb(null, true)
        }

    const upload = multer({ //multer settings
        storage: storage,
        fileFilter: filter,
        onError: (err, next) => {
            next(err);
        },
        limits:{
            fileSize: 1024 * 1024 * 10
        }
    }).single('uploadPic');
    
    return upload;
}

module.exports = multerInit;