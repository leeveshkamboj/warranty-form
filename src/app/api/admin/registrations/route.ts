import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WarrantyRegistration } from "@/models/WarrantyRegistration";
import { User } from "@/models/User";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const username = await getAdminSession();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ username }).lean();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const list = await WarrantyRegistration.find()
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(list);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}
