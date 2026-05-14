import mongoose from "mongoose";

export interface ISubject {
    _id?: mongoose.Types.ObjectId | string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const subjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Subject", subjectSchema);