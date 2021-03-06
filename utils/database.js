exports.docFinder = async(model, id) => {
    const doc = await model.findById(id);
    return doc;
}

exports.docDeleter = async(model, id, next) => {
    try {
        const doc = await model.findByIdAndDelete(id);
        return doc;   
    } catch (error) {
        next(error);
    }    
}