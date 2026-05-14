import mongoose from "mongoose";

export interface IBadge {
    _id?: mongoose.Types.ObjectId | string;
    name?: string;
    description?: string;
    iconUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const badgeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            unique: true
        },

        description: String,

        iconUrl: String
    },
    {
        timestamps: true
    }
);

const Badges = mongoose.models.Badges || mongoose.model("Badges", badgeSchema);
export default Badges;