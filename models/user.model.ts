import mongoose from "mongoose";

export interface IUser {
    _id?: mongoose.Types.ObjectId | string;
    clerkId: string;
    bio?: string;
    role?: "student" | "tutor" | "admin";
    institution?: {
        name?: string;
        email?: string;
        verified?: boolean;
        idCardUrl?: string;
    };
    preferredLanguage?: string;
    knowledgeCredits?: number;
    reputationPoints?: number;
    teachingStreak?: number;
    expertise?: Array<{
        subject?: mongoose.Types.ObjectId | string;
        topic?: mongoose.Types.ObjectId | string;
        proficiencyLevel?: "beginner" | "intermediate" | "advanced" | "expert";
        experiencePoints?: number;
        averageRating?: number;
        totalSessions?: number;
    }>;
    badges?: Array<mongoose.Types.ObjectId | string>;
    availability?: Array<{
        day?: string;
        startTime?: string;
        endTime?: string;
    }>;
    createdAt?: Date;
    updatedAt?: Date;
}

const userSchema = new mongoose.Schema(
{
    clerkId : {
        type : String,
        required : true,
        unique : true
    },

    bio: {
        type: String
    },

    role: {
        type: String,
        enum: ["student", "tutor", "admin"],
        default: "student"
    },

    institution: {
        name: String,
        email: String,
        verified: {
            type: Boolean,
            default: false
        },
        idCardUrl: String
    },

    preferredLanguage: {
        type: String
    },

    knowledgeCredits: {
        type: Number,
        default: 100
    },

    reputationPoints: {
        type: Number,
        default: 0
    },

    teachingStreak: {
        type: Number,
        default: 0
    },

    expertise: [
        {
            subject: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Subject"
            },

            topic: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Topic"
            },

            proficiencyLevel: {
                type: String,
                enum: ["beginner", "intermediate", "advanced", "expert"]
            },

            experiencePoints: {
                type: Number,
                default: 0
            },

            averageRating: {
                type: Number,
                default: 0
            },

            totalSessions: {
                type: Number,
                default: 0
            }
        }
    ],

    badges: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Badge"
        }
    ],

    availability: [
        {
            day: String,
            startTime: String,
            endTime: String
        }
    ]
},
{
    timestamps: true
}
);

const Users = mongoose.models.Users || mongoose.model("Users", userSchema);
export default Users;