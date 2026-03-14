import mongoose, { Schema, model, models } from "mongoose";

export interface IWarrantyCode {
  _id?: mongoose.Types.ObjectId;
  code: string; // 8 digits, unique
  used: boolean;
  usedAt?: Date;
  registrationId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const schema = new Schema<IWarrantyCode>(
  {
    code: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false },
    usedAt: Date,
    registrationId: { type: Schema.Types.ObjectId, ref: "WarrantyRegistration" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

schema.index({ code: 1 });
schema.index({ used: 1 });

export const WarrantyCode =
  models.WarrantyCode ?? model<IWarrantyCode>("WarrantyCode", schema);
