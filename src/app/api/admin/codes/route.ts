import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { WarrantyCode } from "@/models/WarrantyCode";
import { User } from "@/models/User";
import { getAdminSession } from "@/lib/auth";

function normalizeCode(s: string): string {
  return s.replace(/\D/g, "").trim();
}

function extractCodes(input: string): string[] {
  const lines = input.split(/\r?\n/);
  const codes = new Set<string>();
  for (const line of lines) {
    const code = normalizeCode(line);
    if (code.length === 8) codes.add(code);
  }
  return Array.from(codes);
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const used = searchParams.get("used"); // "true" | "false" | omit = all
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
    );
    const search = searchParams.get("search")?.trim().replace(/\D/g, "") ?? "";

    const query: { used?: boolean; code?: RegExp } = {};
    if (used === "true") query.used = true;
    if (used === "false") query.used = false;
    if (search.length > 0) {
      query.code = new RegExp(search, "i");
    }

    const [list, total] = await Promise.all([
      WarrantyCode.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      WarrantyCode.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      data: list,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch codes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const contentType = request.headers.get("content-type") || "";
    let codesToAdd: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "No file provided. Use field name 'file'." },
          { status: 400 }
        );
      }
      const text = await file.text();
      codesToAdd = extractCodes(text);
    } else {
      const body = await request.json();
      const codes = body.codes;
      if (Array.isArray(codes)) {
        codesToAdd = codes.map((c: string) => normalizeCode(String(c))).filter((c: string) => c.length === 8);
      } else if (typeof body.paste === "string") {
        codesToAdd = extractCodes(body.paste);
      } else {
        return NextResponse.json(
          { error: "Provide 'codes' array or 'paste' string." },
          { status: 400 }
        );
      }
    }

    if (codesToAdd.length === 0) {
      return NextResponse.json(
        { error: "No valid 8-digit codes to add." },
        { status: 400 }
      );
    }

    const existing = await WarrantyCode.find({ code: { $in: codesToAdd } }).distinct("code");
    const existingSet = new Set(existing);
    const newCodes = codesToAdd.filter((c) => !existingSet.has(c));

    if (newCodes.length === 0) {
      return NextResponse.json({
        added: 0,
        skipped: codesToAdd.length,
        message: "All codes already exist.",
      });
    }

    await WarrantyCode.insertMany(
      newCodes.map((code) => ({ code, used: false }))
    );

    return NextResponse.json({
      added: newCodes.length,
      skipped: codesToAdd.length - newCodes.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to add codes" },
      { status: 500 }
    );
  }
}
