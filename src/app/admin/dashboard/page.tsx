"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Registration {
  _id: string;
  warrantyRegistrationCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  brandName?: string;
  productName: string;
  dateOfPurchase: string;
  placeOfPurchase: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/registrations", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/admin");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) setRegistrations(data);
        else if (data?.error) setError(data.error);
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/admin");
    router.refresh();
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString();
    } catch {
      return d;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-800">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-800 hover:text-slate-900 text-sm font-medium">
              ← Home
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Warranty registrations</h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 text-sm font-medium hover:bg-slate-50"
          >
            Log out
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
          {registrations.length === 0 ? (
            <div className="p-12 text-center text-slate-700">
              No registrations yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Reg. code</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Brand</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Product</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Shop name</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Date of purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-900">
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800">
                        {r.warrantyRegistrationCode ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {r.firstName} {r.lastName}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{r.email}</td>
                      <td className="py-3 px-4 text-slate-800">{r.phone}</td>
                      <td className="py-3 px-4 text-slate-800">{r.brandName ?? "—"}</td>
                      <td className="py-3 px-4 text-slate-800">{r.productName}</td>
                      <td className="py-3 px-4 text-slate-800">{r.placeOfPurchase}</td>
                      <td className="py-3 px-4 text-slate-800">{r.dateOfPurchase}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
