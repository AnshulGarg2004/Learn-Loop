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
            ref: "Subject",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Topic", topicSchema);