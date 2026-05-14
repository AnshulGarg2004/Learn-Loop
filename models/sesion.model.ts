import mongoose from "mongoose";

export interface ISession {
    _id?: mongoose.Types.ObjectId | string;
    request?: mongoose.Types.ObjectId | string;
    tutor: mongoose.Types.ObjectId | string;
    student: mongoose.Types.ObjectId | string;
    sessionType?: "video" | "audio" | "chat";
    startTime?: Date;
    endTime?: Date;
    meetingLink?: string;
    whiteboardLink?: string;
    status?: "scheduled" | "ongoing" | "completed" | "cancelled";
    resources?: Array<{
        uploadedBy?: mongoose.Types.ObjectId | string;
        fileUrl?: string;
        resourceType?: string;
        uploadedAt?: Date;
    }>;
    sessionSummary?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const sessionSchema = new mongoose.Schema(
    {
        request: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HelpRequests"
        },

        tutor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },

        sessionType: {
            type: String,
            enum: ["video", "audio", "chat"],
            default: "video"
        },

        startTime: Date,

        endTime: Date,

        meetingLink: String,

        whiteboardLink: String,

        status: {
            type: String,
            enum: [
                "scheduled",
                "ongoing",
                "completed",
                "cancelled"
            ],
            default: "scheduled"
        },

        resources: [
            {
                uploadedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users"
                },

                fileUrl: String,

                resourceType: String,

                uploadedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        sessionSummary: String
    },
    {
        timestamps: true
    }
);

const Sessions = mongoose.models.Sessions || mongoose.model("Sessions", sessionSchema);
export default Sessions;