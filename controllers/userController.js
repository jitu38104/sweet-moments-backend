const userController = {
    regiter(req, res, next) {

    },

    logout(req, res, next) {
        req.logOut();
        delete req.session.user;
        res.status(200).json({ msg: "User logout successfully!" });
    },


}

module.exports = userController;