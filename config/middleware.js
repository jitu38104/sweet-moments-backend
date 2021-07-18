const auth = (req, res, next) => {
    if(!req.isAuthenticated()) {
        return res.status(401).json({msg: "login first!"});
    }
    next();
}

module.exports = auth;