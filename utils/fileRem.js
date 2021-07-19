const fs = require('fs');

exports.deleteFolderRecursive = (path) => {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(file => {
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // is it directory or not?
                deleteFolderRecursive(curPath); //if it is dir then recursion
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
}