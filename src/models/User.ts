import mongoose, { Schema, model, models } from "mongoose";

export interface IUser {
  _id?: mongoose.Types.ObjectId;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

const schema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = models.User ?? model<IUser>("User", schema);
