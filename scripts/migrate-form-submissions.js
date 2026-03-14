/**
 * Migrate previous form submissions from Excel into MongoDB.
 *
 * Expects: Previous Form Submissions Data .xlsx in project root
 * Columns: Name_First, Name_Last, Phone, Email, ProductInformation_BrandName,
 *          ProductInformation_ProductName2, ProductInformation_WhereDidYouPurchaseThisProductShopName,
 *          ProductInformation_DateOfPurchase, WarrantyRegistrationCode, Entry_DateSubmitted
 *
 * Output (new files, not the original Excel):
 *   migration-skipped-rows.csv      – rows invalid before migration (Excel_Row, Invalid_Reason + original columns)
 *   migration-runtime-skipped.csv  – rows skipped during migration (e.g. already in DB)
 *
 * Usage:
 *   node scripts/migrate-form-submissions.js              # run migration
 *   node scripts/migrate-form-submissions.js --dry-run    # preview only, no DB writes
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const XLSX = require("xlsx");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env.local or .env");
  process.exit(1);
}

const EXCEL_PATH = path.join(__dirname, "..", "Previous Form Submissions Data .xlsx");

// Schemas (match src/models)
const WarrantyRegistrationSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    brandName: String,
    productName: { type: String, default: "" },
    dateOfPurchase: { type: String, required: true },
    placeOfPurchase: { type: String, required: true },
    warrantyRegistrationCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const WarrantyCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false },
    usedAt: Date,
    registrationId: { type: mongoose.Schema.Types.ObjectId, ref: "WarrantyRegistration" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

WarrantyCodeSchema.index({ code: 1 });
WarrantyCodeSchema.index({ used: 1 });

const WarrantyRegistration =
  mongoose.models.WarrantyRegistration ||
  mongoose.model("WarrantyRegistration", WarrantyRegistrationSchema);
const WarrantyCode =
  mongoose.models.WarrantyCode || mongoose.model("WarrantyCode", WarrantyCodeSchema);

function to8Digits(value) {
  if (value == null) return "";
  const s = String(value).replace(/\D/g, "");
  return s.length >= 8 ? s.slice(0, 8) : s.padStart(8, "0");
}

/** Parse date string DD-MM-YYYY or DD-MM-YYYY HH:mm to Date */
function parseDate(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  if (!trimmed) return null;
  // DD-MM-YYYY or DD-MM-YYYY HH:mm
  const parts = trimmed.split(/\s+/);
  const datePart = parts[0];
  const timePart = parts[1] || "00:00";
  const [d, m, y] = datePart.split(/[-/.]/).map(Number);
  const [hr, min] = timePart.split(":").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d, hr || 0, min || 0, 0, 0);
  return isNaN(date.getTime()) ? null : date;
}

function normalizeDateOfPurchase(value) {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";
  const parsed = parseDate(s);
  if (parsed) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return s;
}

function mapRow(row) {
  const code = to8Digits(row.WarrantyRegistrationCode || row.warrantyRegistrationCode);
  const firstName = String(row.Name_First ?? row.firstName ?? "").trim();
  const lastName = String(row.Name_Last ?? row.lastName ?? "").trim();
  const email = String(row.Email ?? row.email ?? "").trim();
  const phone = String(row.Phone ?? row.phone ?? "").trim();
  const brandName = String(row.ProductInformation_BrandName ?? row.brandName ?? "").trim() || undefined;
  const productName = String(
    row.ProductInformation_ProductName2 ?? row.productName ?? ""
  ).trim();
  const placeOfPurchase = String(
    row.ProductInformation_WhereDidYouPurchaseThisProductShopName ?? row.placeOfPurchase ?? ""
  ).trim();
  const dateOfPurchase = normalizeDateOfPurchase(
    row.ProductInformation_DateOfPurchase ?? row.dateOfPurchase
  );
  const submittedStr =
    row.Entry_DateSubmitted ?? row.Entry_DateCreated ?? row.createdAt ?? "";
  const createdAt = parseDate(submittedStr) || new Date();

  return {
    firstName,
    lastName,
    email,
    phone,
    brandName,
    productName,
    placeOfPurchase,
    dateOfPurchase,
    warrantyRegistrationCode: code,
    createdAt,
  };
}

/** Returns null if valid, or a short reason string if invalid */
function getInvalidReason(m) {
  if (!m.firstName) return "Missing first name";
  if (!m.lastName) return "Missing last name";
  if (!m.email) return "Missing email";
  if (!m.phone) return "Missing phone";
  if (!m.placeOfPurchase) return "Missing place of purchase (shop name)";
  if (!m.dateOfPurchase) return "Missing or invalid date of purchase";
  if (!m.warrantyRegistrationCode || m.warrantyRegistrationCode.length !== 8)
    return "Missing or invalid warranty code (must be 8 digits)";
  return null;
}

function isValidRecord(m) {
  return getInvalidReason(m) === null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("DRY RUN – no data will be written.\n");

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error("File not found:", EXCEL_PATH);
    process.exit(1);
  }

  const workbook = XLSX.readFile(EXCEL_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: "dd-mm-yyyy" });

  /** Escape a value for CSV (quote if contains comma, newline, or quote) */
  function csvEscape(val) {
    const s = val == null ? "" : String(val);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  const invalidRows = [];
  const records = [];
  raw.forEach((row, index) => {
    const mapped = mapRow(row);
    const excelRow = index + 2;
    const reason = getInvalidReason(mapped);
    if (reason) {
      invalidRows.push({
        excelRow,
        reason,
        raw: row,
        mapped: mapped,
      });
    } else {
      records.push({ ...mapped, _excelRow: excelRow });
    }
  });

  const SKIPPED_CSV = path.join(__dirname, "..", "migration-skipped-rows.csv");

  if (invalidRows.length) {
    const headers = Object.keys(raw[0] || {});
    const csvHeader = ["Excel_Row", "Invalid_Reason", ...headers];
    const csvLines = [
      csvHeader.map(csvEscape).join(","),
      ...invalidRows.map(({ excelRow, reason, raw: row }) => {
        const values = [excelRow, reason, ...headers.map((h) => row[h])];
        return values.map(csvEscape).join(",");
      }),
    ];
    fs.writeFileSync(SKIPPED_CSV, csvLines.join("\n"), "utf8");
    console.log(`Sheet: ${sheetName}`);
    console.log(`Total rows: ${raw.length}`);
    console.log(`Valid records: ${records.length}`);
    console.log(`Invalid/skipped: ${invalidRows.length} → written to ${path.basename(SKIPPED_CSV)}`);
  } else {
    console.log(`Sheet: ${sheetName}`);
    console.log(`Total rows: ${raw.length}`);
    console.log(`Valid records: ${records.length}`);
  }

  if (records.length === 0) {
    console.log("Nothing to migrate.");
    process.exit(0);
  }

  if (dryRun) {
    console.log("\nSample record:", JSON.stringify(records[0], null, 2));
    if (invalidRows.length) {
      console.log("\nInvalid rows (see migration-skipped-rows.csv for full list):");
      invalidRows.forEach(({ excelRow, reason, raw: r }) => {
        const name = [r.Name_First, r.Name_Last].filter(Boolean).join(" ") || "—";
        const code = r.WarrantyRegistrationCode || "—";
        console.log(`  Row ${excelRow}: ${reason} (name: ${name}, code: ${code})`);
      });
    }
    process.exit(0);
  }

  await mongoose.connect(MONGODB_URI);

  let created = 0;
  let codesCreated = 0;
  let codesUpdated = 0;
  const runtimeSkipped = [];

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const { _excelRow: excelRow, ...recordWithoutMeta } = r;
    const code = r.warrantyRegistrationCode;
    try {
      const existingReg = await WarrantyRegistration.findOne({
        warrantyRegistrationCode: code,
      }).lean();
      if (existingReg) {
        runtimeSkipped.push({
          excelRow: excelRow ?? i + 2,
          code,
          reason: "Registration already exists in DB, skipped",
          record: recordWithoutMeta,
        });
        continue;
      }

      const doc = await WarrantyRegistration.create({
        ...recordWithoutMeta,
        createdAt: r.createdAt,
      });
      created++;

      let codeDoc = await WarrantyCode.findOne({ code }).lean();
      if (!codeDoc) {
        await WarrantyCode.create({
          code,
          used: true,
          usedAt: r.createdAt,
          registrationId: doc._id,
        });
        codesCreated++;
      } else {
        await WarrantyCode.updateOne(
          { code },
          {
            used: true,
            usedAt: r.createdAt,
            registrationId: doc._id,
          }
        );
        codesUpdated++;
      }
    } catch (err) {
      runtimeSkipped.push({
        excelRow: r._excelRow ?? i + 2,
        code,
        reason: err.message,
        record: recordWithoutMeta,
      });
    }
  }

  if (runtimeSkipped.length) {
    const runtimeCsv = path.join(__dirname, "..", "migration-runtime-skipped.csv");
    const csvHeader = [
      "Excel_Row",
      "Skip_Reason",
      "firstName",
      "lastName",
      "email",
      "phone",
      "brandName",
      "productName",
      "placeOfPurchase",
      "dateOfPurchase",
      "warrantyRegistrationCode",
    ];
    const csvLines = [
      csvHeader.map(csvEscape).join(","),
      ...runtimeSkipped.map(({ excelRow, reason, record: r }) => {
        const values = [
          excelRow,
          reason,
          r.firstName,
          r.lastName,
          r.email,
          r.phone,
          r.brandName ?? "",
          r.productName,
          r.placeOfPurchase,
          r.dateOfPurchase,
          r.warrantyRegistrationCode,
        ];
        return values.map(csvEscape).join(",");
      }),
    ];
    fs.writeFileSync(runtimeCsv, csvLines.join("\n"), "utf8");
    console.log(`  Runtime skipped: ${runtimeSkipped.length} → ${path.basename(runtimeCsv)}`);
  }

  console.log("\nResult:");
  console.log(`  Registrations created: ${created}`);
  console.log(`  Warranty codes created: ${codesCreated}`);
  console.log(`  Warranty codes updated: ${codesUpdated}`);
  if (invalidRows.length) {
    console.log(`  Invalid rows (pre-migration): ${invalidRows.length} → migration-skipped-rows.json`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
