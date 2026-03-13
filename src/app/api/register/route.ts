import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WarrantyRegistration } from "@/models/WarrantyRegistration";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      warrantyRegistrationCode,
      firstName,
      lastName,
      email,
      phone,
      brandName,
      productName,
      dateOfPurchase,
      placeOfPurchase,
    } = body;

    // Warranty registration code: must be exactly 8 digits
    const codeStr = String(warrantyRegistrationCode ?? "").trim();
    if (!/^\d{8}$/.test(codeStr)) {
      return NextResponse.json(
        { error: "Please enter 8 digits" },
        { status: 400 }
      );
    }

    const validCodes = process.env.VALID_REGISTRATION_CODES?.split(",").map((c) => c.trim()).filter(Boolean);
    if (validCodes && validCodes.length > 0 && !validCodes.includes(codeStr)) {
      return NextResponse.json(
        { error: "Invalid registration code" },
        { status: 400 }
      );
    }

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !productName ||
      !dateOfPurchase ||
      !placeOfPurchase
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();
    await WarrantyRegistration.create({
      warrantyRegistrationCode: codeStr,
      firstName,
      lastName,
      email,
      phone,
      brandName: brandName || undefined,
      productName,
      dateOfPurchase,
      placeOfPurchase,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to submit registration" },
      { status: 500 }
    );
  }
}
