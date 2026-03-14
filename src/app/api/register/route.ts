import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WarrantyRegistration } from "@/models/WarrantyRegistration";
import { WarrantyCode } from "@/models/WarrantyCode";

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

    const codeStr = String(warrantyRegistrationCode ?? "").trim();

    // 1) Not exactly 8 digits
    if (!/^\d{8}$/.test(codeStr)) {
      return NextResponse.json(
        { error: "Entered code is not exact 8 digits" },
        { status: 400 }
      );
    }

    await connectDB();

    const codeDoc = await WarrantyCode.findOne({ code: codeStr }).lean();

    // 2) Code not in backend list
    if (!codeDoc) {
      return NextResponse.json(
        { error: "Entered code is invalid" },
        { status: 400 }
      );
    }

    // 3) Code already used
    if (codeDoc.used) {
      return NextResponse.json(
        { error: "Entered code is already used" },
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

    const phoneDigits = String(phone).replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: "Phone number must be at least 10 digits" },
        { status: 400 }
      );
    }

    const registration = await WarrantyRegistration.create({
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

    await WarrantyCode.updateOne(
      { code: codeStr },
      { used: true, usedAt: new Date(), registrationId: registration._id }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to submit registration" },
      { status: 500 }
    );
  }
}
