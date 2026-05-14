import mongoose from "mongoose";

export interface IReport {
    _id?: mongoose.Types.ObjectId | string;
    reporter?: mongoose.Types.ObjectId | string;
    reportedUser?: mongoose.Types.ObjectId | string;
    session?: mongoose.Types.ObjectId | string;
    reason?: string;
    status?: "pending" | "resolved" | "dismissed";
    createdAt?: Date;
    updatedAt?: Date;
}

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session"
        },

        reason: String,

        status: {
            type: String,
            enum: ["pending", "resolved", "dismissed"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Report", reportSchema);