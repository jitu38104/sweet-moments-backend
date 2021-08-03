class customErrorHandler extends Error {
    constructor(msg, code) {
        super();
        this.message = msg;
        this.status = code;
    }

    static alreadyExist(msg="A request conflict with current state of the target resource.") {
        const newInstance = new customErrorHandler(msg, 409);
        return newInstance;
    }

    static notFound(msg = "404 not found") {
        const newInstance = new customErrorHandler(msg, 404);
        return newInstance;
    }

    static authenticationError(msg="Unauthorized user") {
        const newInstance = new customErrorHandler(msg, 401);
        return newInstance;
    }

    static mongooseError(msg="Bad Request") {
        const newInstance = new customErrorHandler(msg, 400);
        return newInstance;
    }

    static forbiddenError(msg="The client cannot access the requested resource.") {
        const newInstance = new customErrorHandler(msg, 403);
        return newInstance;
    }
}

module.exports = customErrorHandler;