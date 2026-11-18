import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            trim: true,
            default: "",
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please provide a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        role: {
            type: String,
            enum: ["customer", "owner", "admin"],
            default: "customer",
        },
        accountStatus: {
            type: String,
            enum: ["active", "suspended"],
            default: "active",
        },
        avatar: {
            type: String,
            default:
                "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Index for query optimization
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
