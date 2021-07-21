const { ValidationError } = require('joi'); 
const { MulterError } = require('multer');
const customErrorHandler = require('../services/CustomErrorHandler');

const errorHandler = (err, req, res, next) => {
    let status_code = 500;
    let data = {
        message: "Internal server error",
        ...(process.env.DEBUG_MODE === 'true' && {orignalError: err.message})
    }
    
    if(err instanceof ValidationError) {       
        status_code = 422
        data.message = err.message;                      
    }

    if(err instanceof customErrorHandler) {
        status_code = err.status;
        data.message = err.message;
    }

    if(err instanceof MulterError) {
        status_code = 400;
        data.message = err.message;
    }

    return res.status(status_code).json({ status: status_code, ...data });
} 

module.exports = errorHandler;