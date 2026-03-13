"use client";

import { useState } from "react";
import Link from "next/link";

// Brand and Product options – match Cognito dropdowns (customize as needed)
const BRAND_OPTIONS = [
  { value: "", label: "Select Brand" },
  { value: "CHIHIROS", label: "CHIHIROS" },
  { value: "Other", label: "Other" },
];

const PRODUCT_OPTIONS = [
  { value: "", label: "Select Model" },
  { value: "RGB VIVID III", label: "RGB VIVID III" },
  { value: "RGB VIVID II BLACK / WHITE", label: "RGB VIVID II BLACK / WHITE" },
  { value: "RGB VIVID MINI", label: "RGB VIVID MINI" },
  { value: "WRGB II 30", label: "WRGB II 30" },
  { value: "WRGB II 45", label: "WRGB II 45" },
  { value: "WRGB II 60", label: "WRGB II 60" },
  { value: "WRGB II 90", label: "WRGB II 90" },
  { value: "WRGB II 120", label: "WRGB II 120" },
  { value: "WRGB SLIM 30", label: "WRGB SLIM 30" },
  { value: "WRGB SLIM 45", label: "WRGB SLIM 45" },
  { value: "WRGB SLIM 60", label: "WRGB SLIM 60" },
  { value: "WRGB SLIM 90", label: "WRGB SLIM 90" },
  { value: "WRGB SLIM 120", label: "WRGB SLIM 120" },
  { value: "WRGB II PRO SERIES 30", label: "WRGB II PRO SERIES 30" },
  { value: "WRGB II PRO SERIES 45", label: "WRGB II PRO SERIES 45" },
  { value: "WRGB II PRO SERIES 60", label: "WRGB II PRO SERIES 60" },
  { value: "WRGB II PRO SERIES 80", label: "WRGB II PRO SERIES 80" },
  { value: "WRGB II PRO SERIES 90", label: "WRGB II PRO SERIES 90" },
  { value: "WRGB II PRO SERIES 120", label: "WRGB II PRO SERIES 120" },
  { value: "UNIVERSAL WRGB 550", label: "UNIVERSAL WRGB 550" },
  { value: "UNIVERSAL WRGB 600", label: "UNIVERSAL WRGB 600" },
  { value: "UNIVERSAL WRGB 700", label: "UNIVERSAL WRGB 700" },
  { value: "UNIVERSAL WRGB 800", label: "UNIVERSAL WRGB 800" },
  { value: "UNIVERSAL WRGB 920", label: "UNIVERSAL WRGB 920" },
  { value: "UNIVERSAL WRGB 1000", label: "UNIVERSAL WRGB 1000" },
  { value: "UNIVERSAL WRGB 1200", label: "UNIVERSAL WRGB 1200" },
  { value: "UNIVERSAL WRGB 1500", label: "UNIVERSAL WRGB 1500" },
];

export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    brandName: "",
    productName: "",
    placeOfPurchase: "",
    dateOfPurchase: "",
    warrantyRegistrationCode: "",
  });

  const update = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = form.warrantyRegistrationCode.replace(/\D/g, "");
    if (code.length !== 8) {
      setError("Please enter 8 digits");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, warrantyRegistrationCode: code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Registration submitted</h2>
          <p className="text-slate-700 mb-6">
            Thank you. Your product warranty registration has been received.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-5 py-2.5 text-white font-medium hover:bg-slate-700"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-slate-800 hover:text-slate-900 text-sm mb-6 inline-block font-medium">
          ← Back
        </Link>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden text-slate-900">
          <div className="bg-slate-800 text-white px-6 py-5">
            <h1 className="text-2xl font-bold">Product Warranty Registration</h1>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Name * – First / Last */}
            <fieldset className="border-0 p-0 m-0">
              <legend className="text-sm font-medium text-slate-800 mb-2">
                Name <span className="text-red-600">*</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  autoComplete="given-name"
                  placeholder="First"
                  required
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
                <input
                  type="text"
                  autoComplete="family-name"
                  placeholder="Last"
                  required
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
            </fieldset>

            {/* Phone * | Email * */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-800 mb-1">
                  Phone <span className="text-red-600">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-800 mb-1">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                />
              </div>
            </div>

            {/* Product Information */}
            <section className="border-t border-slate-200 pt-6" aria-labelledby="product-info-heading">
              <h2 id="product-info-heading" className="text-lg font-semibold text-slate-900 mb-4">
                Product Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="brand" className="block text-sm font-medium text-slate-800 mb-1">
                    Brand Name
                  </label>
                  <select
                    id="brand"
                    value={form.brandName}
                    onChange={(e) => update("brandName", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    {BRAND_OPTIONS.map((o) => (
                      <option key={o.value || "empty"} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="product" className="block text-sm font-medium text-slate-800 mb-1">
                    Product Name <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="product"
                    required
                    value={form.productName}
                    onChange={(e) => update("productName", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    {PRODUCT_OPTIONS.map((o) => (
                      <option key={o.value || "empty"} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-sm font-medium text-slate-900">WARRANTY PERIOD - ONE YEAR</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="shop" className="block text-sm font-medium text-slate-800 mb-1">
                    Where did you purchase this product (Shop Name)? <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="shop"
                    type="text"
                    required
                    value={form.placeOfPurchase}
                    onChange={(e) => update("placeOfPurchase", e.target.value)}
                    placeholder="e.g. Store name, area"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  />
                  <p className="text-xs text-slate-600 mt-1 italic">Please enter name of the store and area</p>
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-slate-800 mb-1">
                    Date of Purchase <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="date"
                    type="date"
                    required
                    value={form.dateOfPurchase}
                    onChange={(e) => update("dateOfPurchase", e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-800 mb-1">
                  Warranty Registration Code <span className="text-red-600">*</span>
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  required
                  value={form.warrantyRegistrationCode}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                    update("warrantyRegistrationCode", v);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 font-mono tracking-wider"
                />
                <p className="text-xs text-slate-600 mt-1 italic">
                  Please enter the 8 digit code as shown beside the QR Code
                </p>
              </div>
            </section>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-slate-800 px-6 py-3 text-white font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? "Submitting…" : "Register"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
