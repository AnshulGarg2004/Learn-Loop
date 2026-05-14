import mongoose from "mongoose";

export interface INotification {
    _id?: mongoose.Types.ObjectId | string;
    user?: mongoose.Types.ObjectId | string;
    title?: string;
    message?: string;
    isRead?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        title: String,

        message: String,

        isRead: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model(
    "Notification",
    notificationSchema
);