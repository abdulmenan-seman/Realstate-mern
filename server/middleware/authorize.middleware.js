import { errorHandler } from "../utils/error.js";

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return next(
                errorHandler(
                    403,
                    `Access denied: requires ${allowedRoles.join(" or ")} role. Your role is ${req.user?.role || "unauthorized"}.`
                )
            );
        }
        next();
    };
};
