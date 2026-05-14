import mongoose from "mongoose";

export interface IReview {
    _id?: mongoose.Types.ObjectId | string;
    session?: mongoose.Types.ObjectId | string;
    reviewer?: mongoose.Types.ObjectId | string;
    reviewee?: mongoose.Types.ObjectId | string;
    rating?: number;
    feedback?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const reviewSchema = new mongoose.Schema(
    {
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session"
        },

        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        reviewee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        rating: {
            type: Number,
            min: 1,
            max: 5
        },

        feedback: String
    },
    {
        timestamps: true
    }
);

const Reviews = mongoose.models.Reviews || mongoose.model("Reviews", reviewSchema);
export default Reviews;