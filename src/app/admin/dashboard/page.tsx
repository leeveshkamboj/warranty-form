"use client";

import { useEffect, useState, useCallback } from "react";
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

const PAGE_SIZE = 20;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [editing, setEditing] = useState<Registration | null>(null);
  const [editForm, setEditForm] = useState<Partial<Registration>>({});
  const [saveConfirm, setSaveConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    (pageNum: number, search: string) => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      params.set("limit", String(PAGE_SIZE));
      if (search.trim()) params.set("search", search.trim());
      fetch(`/api/admin/registrations?${params}`, { credentials: "include" })
        .then((res) => {
          if (res.status === 401) {
            router.replace("/admin");
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data && !data.error) {
            setRegistrations(data.data ?? []);
            setTotal(data.total ?? 0);
            setPage(data.page ?? 1);
            setTotalPages(data.totalPages ?? 1);
          } else if (data?.error) setError(data.error);
        })
        .catch(() => setError("Failed to load data"))
        .finally(() => setLoading(false));
    },
    [router]
  );

  useEffect(() => {
    load(page, searchQuery);
  }, [page, searchQuery, load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

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
      load(page, searchQuery);
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
      load(page, searchQuery);
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
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8 px-4 text-slate-900">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Link href="/" className="text-slate-800 hover:text-slate-900 text-sm font-medium py-2">
                ← Home
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Warranty registrations</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/codes"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 text-sm font-medium hover:bg-slate-50 min-h-[44px] inline-flex items-center justify-center"
              >
                Manage codes
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-800 text-sm font-medium hover:bg-slate-50 min-h-[44px]"
              >
                Log out
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
          <label htmlFor="search" className="sr-only">
            Search by name, email, phone or code
          </label>
          <input
            id="search"
            type="search"
            placeholder="Search by name, email, phone or code…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full sm:max-w-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 text-sm"
          />
          {searchQuery && (
            <span className="text-slate-600 text-sm">
              {total} result{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
          {registrations.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-slate-700 text-sm sm:text-base">
              {searchQuery
                ? "No entries match your search."
                : "No registrations yet."}
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="md:hidden divide-y divide-slate-100">
                {registrations.map((r) => (
                  <div key={r._id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-slate-900">
                        {r.firstName} {r.lastName}
                      </span>
                      <span className="font-mono text-slate-600 text-xs shrink-0">
                        {r.warrantyRegistrationCode ?? "—"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <p>{r.email}</p>
                      <p>{r.phone}</p>
                      {r.productName ? <p>{r.productName}</p> : null}
                      <p>{r.placeOfPurchase} · {r.dateOfPurchase}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 text-sm font-medium hover:bg-slate-50 min-h-[44px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteId(r._id)}
                        className="rounded-lg border border-red-200 bg-white px-3 py-2 text-red-600 text-sm font-medium hover:bg-red-50 min-h-[44px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop: table - scrollable, full text visible */}
              <div className="hidden md:block overflow-x-auto overflow-y-visible">
                <table className="w-full text-sm border-collapse min-w-max">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Date</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Reg. code</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Name</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Email</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Phone</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Brand</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Product</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Shop name</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Date of purchase</th>
                      <th className="text-left py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((r) => (
                      <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50 text-slate-900">
                        <td className="py-3 px-3 text-slate-700 whitespace-nowrap align-top">
                          {formatDate(r.createdAt)}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-800 whitespace-nowrap align-top">
                          {r.warrantyRegistrationCode ?? "—"}
                        </td>
                        <td className="py-3 px-3 text-slate-800 align-top whitespace-nowrap">
                          {r.firstName} {r.lastName}
                        </td>
                        <td className="py-3 px-3 text-slate-800 align-top">
                          <span className="block break-all">{r.email}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 align-top whitespace-nowrap">
                          {r.phone}
                        </td>
                        <td className="py-3 px-3 text-slate-800 align-top">
                          <span className="block">{r.brandName ?? "—"}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 align-top">
                          <span className="block">{r.productName ?? "—"}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 align-top">
                          <span className="block">{r.placeOfPurchase}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 align-top whitespace-nowrap">
                          {r.dateOfPurchase}
                        </td>
                        <td className="py-3 px-3 align-top whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="text-slate-700 hover:text-slate-900 underline text-xs font-medium py-1"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(r._id)}
                              className="text-red-600 hover:text-red-800 underline text-xs font-medium py-1"
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
            </>
          )}

          {totalPages > 1 && (
            <div className="border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
                {total > 0 && (
                  <span className="ml-1">
                    ({((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total})
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none min-h-[44px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-4 sm:p-6 border-b border-slate-200 shrink-0">
              <h2 className="text-lg font-semibold text-slate-900">Edit registration</h2>
              <p className="text-sm text-slate-600 mt-1">Code: {editing.warrantyRegistrationCode}</p>
            </div>
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
            <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col gap-2 shrink-0">
              {saveConfirm && (
                <p className="text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2">
                  Are you sure you want to save these changes?
                </p>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setEditing(null); setSaveConfirm(false); }}
                  className="rounded-xl border border-slate-300 px-4 py-3 text-slate-800 text-sm font-medium hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="rounded-xl bg-slate-800 px-4 py-3 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 min-h-[44px]"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete registration</h2>
            <p className="text-slate-700 text-sm mb-6">
              Are you sure you want to delete this registration? The warranty code will become available again for reuse.
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-800 text-sm font-medium hover:bg-slate-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-3 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
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
