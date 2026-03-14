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
  const [editing, setEditing] = useState<Registration | null>(null);
  const [editForm, setEditForm] = useState<Partial<Registration>>({});
  const [saveConfirm, setSaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
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
  };

  useEffect(() => {
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    router.replace("/admin");
    router.refresh();
  };

  const openEdit = (r: Registration) => {
    setEditing(r);
    setEditForm({
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      brandName: r.brandName ?? "",
      productName: r.productName,
      dateOfPurchase: r.dateOfPurchase,
      placeOfPurchase: r.placeOfPurchase,
    });
    setSaveConfirm(false);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!saveConfirm) {
      setSaveConfirm(true);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/registrations/${editing._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phone: editForm.phone,
          brandName: editForm.brandName || undefined,
          productName: editForm.productName,
          dateOfPurchase: editForm.dateOfPurchase,
          placeOfPurchase: editForm.placeOfPurchase,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setEditing(null);
      setSaveConfirm(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/registrations/${deleteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setDeleteId(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
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
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/" className="text-slate-800 hover:text-slate-900 text-sm font-medium">
              ← Home
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Warranty registrations</h1>
            <Link
              href="/admin/codes"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 text-sm font-medium hover:bg-slate-50"
            >
              Manage codes
            </Link>
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
                    <th className="text-left py-3 px-4 font-semibold text-slate-800">Actions</th>
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
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="text-slate-700 hover:text-slate-900 underline text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(r._id)}
                            className="text-red-600 hover:text-red-800 underline text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Edit registration</h2>
              <p className="text-sm text-slate-600 mt-1">Code: {editing.warrantyRegistrationCode}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First name</label>
                  <input
                    value={editForm.firstName ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last name</label>
                  <input
                    value={editForm.lastName ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full rounded border border-slate-300 px-2 py-1.5 text-slate-900 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input
                  value={editForm.phone ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Brand</label>
                <input
                  value={editForm.brandName ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, brandName: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Product name</label>
                <input
                  value={editForm.productName ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, productName: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Shop name</label>
                <input
                  value={editForm.placeOfPurchase ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, placeOfPurchase: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-slate-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Date of purchase</label>
                <input
                  type="date"
                  value={editForm.dateOfPurchase ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, dateOfPurchase: e.target.value }))}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-slate-900 text-sm"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex flex-col gap-2">
              {saveConfirm && (
                <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                  Are you sure you want to save these changes?
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setEditing(null); setSaveConfirm(false); }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-slate-800 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : saveConfirm ? "Yes, save changes" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete registration</h2>
            <p className="text-slate-700 text-sm mb-6">
              Are you sure you want to delete this registration? The warranty code will become available again for reuse.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-800 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
