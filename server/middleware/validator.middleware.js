import { errorHandler } from "../utils/error.js";

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export const validateSignup = (req, res, next) => {
    let { username, fullName, email, password, role } = req.body;

    if (!username && fullName) {
        username = fullName.toLowerCase().replace(/\s+/g, "") + Math.floor(1000 + Math.random() * 9000);
        req.body.username = username;
    }

    if (!username || !email || !password) {
        return next(errorHandler(400, "Username, email, and password are required."));
    }

    if (username.trim().length < 3) {
        return next(errorHandler(400, "Username must be at least 3 characters long."));
    }

    if (!EMAIL_REGEX.test(email.trim())) {
        return next(errorHandler(400, "Please provide a valid email address."));
    }

    if (password.length < 6) {
        return next(errorHandler(400, "Password must be at least 6 characters long."));
    }

    // CRITICAL SECURITY RULE: Public registration must NEVER allow creating an admin
    if (role && role.toLowerCase() === "admin") {
        return next(errorHandler(403, "Admin registration is not permitted via public registration."));
    }

    if (role && !["customer", "owner"].includes(role.toLowerCase())) {
        return next(errorHandler(400, "Role must be either 'customer' or 'owner'."));
    }

    next();
};

export const validateSignin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(errorHandler(400, "Email and password are required."));
    }

    if (!EMAIL_REGEX.test(email.trim())) {
        return next(errorHandler(400, "Please provide a valid email address."));
    }

    next();
};

export const validateProfileUpdate = (req, res, next) => {
    // CRITICAL SECURITY RULE: Prevent users from changing their own privileged role or accountStatus
    if (req.body.role !== undefined) {
        delete req.body.role;
    }
    if (req.body.accountStatus !== undefined) {
        delete req.body.accountStatus;
    }

    if (req.body.email && !EMAIL_REGEX.test(req.body.email.trim())) {
        return next(errorHandler(400, "Please provide a valid email address."));
    }

    if (req.body.password && req.body.password.length < 6) {
        return next(errorHandler(400, "Password must be at least 6 characters long."));
    }

    next();
};
