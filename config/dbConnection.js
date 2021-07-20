const mongoose = require('mongoose');

const dbConnectivity = (url) => {
    return mongoose.connect(url, { 
        useNewUrlParser: true, 
        useCreateIndex: true, 
        useUnifiedTopology: true, 
        useFindAndModify: false 
    });
}

module.exports = dbConnectivity;