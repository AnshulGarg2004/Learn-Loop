import mongoose from "mongoose";

export interface IUser {
    _id?: mongoose.Types.ObjectId | string;
    clerkId: string;
    email: string;
    name?: string;
    imageUrl?: string;
    bio?: string;
    role?: "student" | "tutor" | "both" | "admin";
    college?: string;
    skills?: string[];
    subjects?: string[];
    languages?: string[];
    learningInterests?: string[];
    onboardingCompleted?: boolean;
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

    email: {
        type: String,
        required: true,
        unique: true
    },

    name: {
        type: String
    },

    imageUrl: {
        type: String
    },

    bio: {
        type: String
    },

    role: {
        type: String,
        enum: ["student", "tutor", "both", "admin"],
        default: "student"
    },

    college: {
        type: String
    },

    skills: [
        {
            type: String
        }
    ],

    subjects: [
        {
            type: String
        }
    ],

    languages: [
        {
            type: String
        }
    ],

    learningInterests: [
        {
            type: String
        }
    ],

    onboardingCompleted: {
        type: Boolean,
        default: false
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
                ref: "Subjects"
            },

            topic: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Topics"
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
            ref: "Badges"
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