const customErrorHandler = require("../services/CustomErrorHandler");
const jwtService = require('../services/JwtService');

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader) {
        return next(customErrorHandler.authenticationError());
    }

    const token = authHeader.split(' ')[1];

    try {
        const { _id, role } = jwtService.varify(token);   
        
        req.user = {};
        req.user._id = _id;
        req.user.role = role;
    } catch (error) {
        return next(customErrorHandler.authenticationError(error.message));
    }

    next();
}

module.exports = auth;