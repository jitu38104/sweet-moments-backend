const userModel = require("../models/user");
const customErrorHandler = require("../services/CustomErrorHandler");
const jwtService = require('../services/JwtService');
const { docFinder } = require("../utils/database");

const auth = async(req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if(!authHeader) {
        return next(customErrorHandler.authenticationError());
    }

    const token = authHeader.split(' ')[1];

    try {
        const { _id, role } = jwtService.varify(token); 
        
        const isUser = await docFinder(userModel, _id);

        if(!isUser) {
            return next(customErrorHandler.authenticationError());
        }
        
        req.user = { _id, role };                
    } catch (error) {
        return next(customErrorHandler.authenticationError(error.message));
    }

    next();
}

module.exports = auth;