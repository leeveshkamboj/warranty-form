import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
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
    const doc = await WarrantyCode.findById(id);
    if (!doc) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }
    if (!doc.used) {
      return NextResponse.json({ error: "Code is already unused" }, { status: 400 });
    }
    await WarrantyCode.updateOne(
      { _id: id },
      { $set: { used: false }, $unset: { usedAt: "", registrationId: "" } }
    );
    const updated = await WarrantyCode.findById(id).lean();
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update code" },
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
    const doc = await WarrantyCode.findByIdAndDelete(id);
    if (!doc) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete code" },
      { status: 500 }
    );
  }
}
