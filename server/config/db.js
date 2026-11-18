import mongoose from "mongoose";

const connectDB = async () => {
    const primaryUri = process.env.MONGO || process.env.MONGODB_URI;
    const localUri = "mongodb://127.0.0.1:27017/realestatehub";

    if (primaryUri) {
        try {
            const conn = await mongoose.connect(primaryUri, {
                serverSelectionTimeoutMS: 3000,
            });
            console.log(`Connected to MongoDB: ${conn.connection.host}`);
            return;
        } catch (error) {
            console.warn(
                `Primary MongoDB connection failed (${error.message}). Falling back to local MongoDB...`
            );
        }
    }

    try {
        const localConn = await mongoose.connect(localUri);
        console.log(`Connected to local MongoDB: ${localConn.connection.host}`);
    } catch (localError) {
        console.error("Local MongoDB connection error:", localError.message);
    }
};

export default connectDB;
