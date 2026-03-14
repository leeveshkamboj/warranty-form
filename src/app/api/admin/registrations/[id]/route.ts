import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WarrantyRegistration } from "@/models/WarrantyRegistration";
import { WarrantyCode } from "@/models/WarrantyCode";
import { User } from "@/models/User";
import { getAdminSession } from "@/lib/auth";

async function requireAdmin() {
  const username = await getAdminSession();
  if (!username) return null;
  await connectDB();
  const user = await User.findOne({ username }).lean();
  return user ? username : null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const doc = await WarrantyRegistration.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(body.firstName != null && { firstName: body.firstName }),
          ...(body.lastName != null && { lastName: body.lastName }),
          ...(body.email != null && { email: body.email }),
          ...(body.phone != null && { phone: body.phone }),
          ...(body.brandName !== undefined && { brandName: body.brandName }),
          ...(body.productName != null && { productName: body.productName }),
          ...(body.dateOfPurchase != null && { dateOfPurchase: body.dateOfPurchase }),
          ...(body.placeOfPurchase != null && { placeOfPurchase: body.placeOfPurchase }),
        },
      },
      { new: true }
    ).lean();
    if (!doc) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    return NextResponse.json(doc);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ok = await requireAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const reg = await WarrantyRegistration.findById(id).lean();
    if (!reg) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }
    await WarrantyRegistration.findByIdAndDelete(id);
    await WarrantyCode.updateOne(
      { code: reg.warrantyRegistrationCode },
      { $set: { used: false, usedAt: null, registrationId: null } }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete registration" },
      { status: 500 }
    );
  }
}
