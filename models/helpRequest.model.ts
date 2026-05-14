import mongoose from "mongoose";

export interface IHelpRequest {
    _id?: mongoose.Types.ObjectId | string;
    student: mongoose.Types.ObjectId | string;
    subject?: mongoose.Types.ObjectId | string;
    topic?: mongoose.Types.ObjectId | string;
    title: string;
    description?: string;
    preferredLanguage?: string;
    urgencyLevel?: "low" | "medium" | "high";
    sessionDuration?: number;
    creditsOffered?: number;
    status?: "open" | "matched" | "ongoing" | "completed" | "cancelled";
    applications?: Array<{
        tutor?: mongoose.Types.ObjectId | string;
        message?: string;
        status?: "pending" | "accepted" | "rejected";
        appliedAt?: Date;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
}

const helpRequestSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Users",
            required: true
        },

        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subjects"
        },

        topic: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Topics"
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        preferredLanguage: {
            type: String
        },

        urgencyLevel: {
            type: String,
            enum: ["low", "medium", "high"]
        },

        sessionDuration: {
            type: Number
        },

        creditsOffered: {
            type: Number,
            default: 10
        },

        status: {
            type: String,
            enum: [
                "open",
                "matched",
                "ongoing",
                "completed",
                "cancelled"
            ],
            default: "open"
        },

        applications: [
            {
                tutor: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Users"
                },

                message: String,

                status: {
                    type: String,
                    enum: ["pending", "accepted", "rejected"],
                    default: "pending"
                },

                appliedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const HelpRequests = mongoose.models.HelpRequests || mongoose.model("HelpRequests", helpRequestSchema);
export default HelpRequests;