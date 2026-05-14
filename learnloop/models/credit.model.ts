import mongoose from "mongoose";

export interface ICreditTransaction {
    _id?: mongoose.Types.ObjectId | string;
    sender?: mongoose.Types.ObjectId | string;
    receiver?: mongoose.Types.ObjectId | string;
    session?: mongoose.Types.ObjectId | string;
    amount: number;
    transactionType?:
        | "session_payment"
        | "bonus_reward"
        | "refund"
        | "achievement_reward";
    createdAt?: Date;
    updatedAt?: Date;
}

const creditTransactionSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session"
        },

        amount: {
            type: Number,
            required: true
        },

        transactionType: {
            type: String,
            enum: [
                "session_payment",
                "bonus_reward",
                "refund",
                "achievement_reward"
            ]
        }
    },
    {
        timestamps: true
    }
);

const CreditTransactions = mongoose.models.CreditTransactions || mongoose.model("CreditTransactions", creditTransactionSchema);
export default CreditTransactions;

