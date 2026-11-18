import User from "../models/User.model.js";
import { errorHandler } from "../utils/error.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
};

const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || "fallback_secret_realestatehub",
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );
};

export const signup = async (req, res, next) => {
    try {
        const { username, fullName, email, password, role, phone } = req.body;

        const normalizedEmail = email.trim().toLowerCase();
        const trimmedUsername = username.trim();

        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username: trimmedUsername }],
        });

        if (existingUser) {
            const isEmailConflict = existingUser.email === normalizedEmail;
            return next(
                errorHandler(
                    409,
                    isEmailConflict
                        ? "An account with this email already exists."
                        : "This username is already taken. Please choose another."
                )
            );
        }

        const safeRole = role && ["customer", "owner"].includes(role.toLowerCase())
            ? role.toLowerCase()
            : "customer";

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username: trimmedUsername,
            fullName: fullName?.trim() || trimmedUsername,
            email: normalizedEmail,
            password: hashedPassword,
            role: safeRole,
            phone: phone?.trim() || "",
            accountStatus: "active",
            avatar:
                req.body.avatar ||
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
        });

        await newUser.save();

        const token = generateToken(newUser);
        const safeUser = newUser.toJSON();

        res.cookie("access_token", token, COOKIE_OPTIONS)
            .status(201)
            .json({
                success: true,
                message: "User registered successfully",
                token,
                user: safeUser,
                ...safeUser,
            });
    } catch (error) {
        console.error("Signup error:", error);
        next(error);
    }
};

export const signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.trim().toLowerCase();

        const validUser = await User.findOne({ email: normalizedEmail });
        if (!validUser) {
            return next(errorHandler(400, "Invalid email or password."));
        }

        const isPasswordValid = bcrypt.compareSync(password, validUser.password);
        if (!isPasswordValid) {
            return next(errorHandler(400, "Invalid email or password."));
        }

        if (validUser.accountStatus === "suspended") {
            return next(
                errorHandler(
                    403,
                    "Your account has been suspended. Please contact customer support."
                )
            );
        }

        const token = generateToken(validUser);
        const safeUser = validUser.toJSON();

        res.cookie("access_token", token, COOKIE_OPTIONS)
            .status(200)
            .json({
                success: true,
                message: "Signed in successfully",
                token,
                user: safeUser,
                ...safeUser,
            });
    } catch (error) {
        console.error("Signin error:", error);
        next(error);
    }
};

export const google = async (req, res, next) => {
    try {
        const normalizedEmail = req.body.email.trim().toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            if (user.accountStatus === "suspended") {
                return next(
                    errorHandler(
                        403,
                        "Your account has been suspended. Please contact customer support."
                    )
                );
            }

            const token = generateToken(user);
            const safeUser = user.toJSON();

            return res
                .cookie("access_token", token, COOKIE_OPTIONS)
                .status(200)
                .json({
                    success: true,
                    message: "Signed in with Google successfully",
                    token,
                    user: safeUser,
                    ...safeUser,
                });
        } else {
            const generatedPassword =
                Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8) +
                "!Aa1";
            const hashedPassword = bcrypt.hashSync(generatedPassword, 10);

            const generatedUsername =
                (req.body.name || "user")
                    .split(" ")
                    .join("")
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, "") +
                Math.random().toString(36).slice(-4);

            user = new User({
                username: generatedUsername,
                fullName: req.body.name || generatedUsername,
                email: normalizedEmail,
                password: hashedPassword,
                role: "customer",
                accountStatus: "active",
                avatar:
                    req.body.photo ||
                    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
            });

            await user.save();

            const token = generateToken(user);
            const safeUser = user.toJSON();

            return res
                .cookie("access_token", token, COOKIE_OPTIONS)
                .status(200)
                .json({
                    success: true,
                    message: "Google account connected successfully",
                    token,
                    user: safeUser,
                    ...safeUser,
                });
        }
    } catch (error) {
        console.error("Google auth error:", error);
        next(error);
    }
};

export const logout = (req, res) => {
    res.clearCookie("access_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    return res.status(200).json({
        success: true,
        message: "Logged out successfully",
    });
};

export const getMe = (req, res) => {
    const safeUser = req.user.toJSON();
    return res.status(200).json({
        success: true,
        user: safeUser,
        ...safeUser,
    });
};
