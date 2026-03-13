import mongoose, { Schema, model, models } from "mongoose";

export interface IWarrantyRegistration {
  _id?: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  brandName?: string;
  productName: string;
  dateOfPurchase: string;
  placeOfPurchase: string; // Where did you purchase (Shop Name)
  warrantyRegistrationCode: string;
  createdAt: Date;
}

const schema = new Schema<IWarrantyRegistration>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    brandName: String,
    productName: { type: String, required: true },
    dateOfPurchase: { type: String, required: true },
    placeOfPurchase: { type: String, required: true },
    warrantyRegistrationCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const WarrantyRegistration =
  models.WarrantyRegistration ?? model<IWarrantyRegistration>("WarrantyRegistration", schema);
