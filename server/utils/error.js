export class ApiError extends Error {
    constructor(statusCode, message, errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.success = false;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (statusCode, message, errors = []) => {
    return new ApiError(statusCode, message, errors);
};
