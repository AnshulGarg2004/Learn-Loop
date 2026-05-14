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
        title?: string;
        uploadedAt?: Date;
    }>;
    sessionSummary?: string;
    messages?: Array<{
        senderId?: string;
        senderName?: string;
        message?: string;
        timestamp?: Date;
    }>;
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
                title: String,
                uploadedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        sessionSummary: String,
        messages: [{
            senderId: String,
            senderName: String,
            message: String,
            timestamp: { type: Date, default: Date.now }
        }],
        aiMessages: [{
            role: String,
            content: String,
            timestamp: { type: Date, default: Date.now }
        }],
        rating: {
          type: Number,
          min: 1,
          max: 5
        }
    },
    {
        timestamps: true
    }
);

const Sessions = mongoose.models.Sessions || mongoose.model("Sessions", sessionSchema);
export default Sessions;