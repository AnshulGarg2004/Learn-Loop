import mongoose from "mongoose";

export interface ITopic {
    _id?: mongoose.Types.ObjectId | string;
    name: string;
    subject: mongoose.Types.ObjectId | string;
    createdAt?: Date;
    updatedAt?: Date;
}

const topicSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subjects",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const Topics = mongoose.models.Topics || mongoose.model("Topics", topicSchema);
export default Topics;