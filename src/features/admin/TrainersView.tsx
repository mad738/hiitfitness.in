"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Trainer } from "@/models/trainer";
import {
  listTrainers,
  createTrainer,
  updateTrainer,
  deleteTrainer,
} from "@app/actions/trainers";
import { readFileAsBase64 } from "@/lib/image-utils";

type Props = { initialTrainers: Trainer[] };

const inputClass =
  "w-full px-3 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 text-stone-100 placeholder:text-stone-500 focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none text-sm";
const labelClass = "block text-sm text-stone-400 mb-1.5";

export function TrainersView({ initialTrainers }: Props) {
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>(initialTrainers);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [detailsTrainer, setDetailsTrainer] = useState<Trainer | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function openAdd() {
    setEditing(null);
    setName("");
    setImage(null);
    setPhoneNumber("");
    setAddress("");
    setFormOpen(true);
    setError(null);
  }

  function openEdit(t: Trainer) {
    setEditing(t);
    setName(t.name);
    setImage(t.image);
    setPhoneNumber(t.phone_number ?? "");
    setAddress(t.address ?? "");
    setFormOpen(true);
    setError(null);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setError(null);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const data = await readFileAsBase64(file);
    if (data) setImage(data);
  }

  function clearImage() {
    setImage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    setLoading(true);
    try {
      if (editing) {
        const res = await updateTrainer(editing.id, {
          name: trimmedName,
          image: image,
          phone_number: phoneNumber.trim() || null,
          address: address.trim() || null,
        });
        if (res.ok) {
          setTrainers((prev) =>
            prev.map((t) =>
              t.id === editing.id
                ? {
                    ...t,
                    name: trimmedName,
                    image: image ?? t.image,
                    phone_number: phoneNumber.trim() || null,
                    address: address.trim() || null,
                    updated_at: new Date().toISOString(),
                  }
                : t
            )
          );
          closeForm();
          router.refresh();
        } else {
          setError(res.error);
        }
      } else {
        const res = await createTrainer({
          name: trimmedName,
          image: image ?? null,
          phone_number: phoneNumber.trim() || null,
          address: address.trim() || null,
        });
        if (res.ok) {
          router.refresh();
          closeForm();
        } else {
          setError(res.error);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(t: Trainer) {
    if (!confirm(`Remove trainer "${t.name}"?`)) return;
    setLoading(true);
    const res = await deleteTrainer(t.id);
    setLoading(false);
    if (res.ok) {
      setTrainers((prev) => prev.filter((x) => x.id !== t.id));
      if (editing?.id === t.id) closeForm();
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAdd}
          className="px-4 py-2 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm transition"
        >
          Add trainer
        </button>
      </div>

      {formOpen && (
        <div className="liquid-glass p-6 rounded-2xl border border-white/10">
          <h2 className="text-lg font-semibold text-stone-100 mb-4">
            {editing ? "Edit trainer" : "New trainer"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-brand-red text-sm bg-brand-red/10 px-3 py-2 rounded">
                {error}
              </p>
            )}
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Photo</label>
              <div className="flex items-center gap-4 flex-wrap">
                {image ? (
                  <>
                    <img
                      src={image}
                      alt="Preview"
                      className="w-20 h-20 rounded-xl object-cover border border-white/10"
                    />
                    <div className="flex gap-2">
                      <label className="cursor-pointer px-3 py-2 rounded-lg border border-white/20 text-stone-300 hover:bg-white/5 text-sm">
                        Change
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleImageChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="px-3 py-2 rounded-lg border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-stone-400 hover:border-brand-red/50 hover:text-brand-red text-sm transition">
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
            <div>
              <label className={labelClass}>Phone number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={inputClass}
                placeholder="e.g. 9996667714"
              />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass + " min-h-[80px]"}
                placeholder="Full address"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm disabled:opacity-50"
              >
                {loading ? "Saving…" : editing ? "Update" : "Add"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trainer details card modal */}
      {detailsTrainer && mounted && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setDetailsTrainer(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trainer-details-title"
          >
            <div
              className="liquid-glass rounded-2xl border border-white/10 shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 id="trainer-details-title" className="text-lg font-bold text-stone-100">
                  Trainer details
                </h2>
                <button
                  type="button"
                  onClick={() => setDetailsTrainer(null)}
                  className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/10"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <img
                    src={detailsTrainer.image ?? "/images/profile placeholder.jpg"}
                    alt=""
                    className="w-24 h-24 rounded-xl object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-stone-100">{detailsTrainer.name}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-1 gap-3 text-sm">
                  <div><dt className="text-stone-500">Phone</dt><dd className="text-stone-100">{detailsTrainer.phone_number ?? "—"}</dd></div>
                  <div><dt className="text-stone-500">Address</dt><dd className="text-stone-100">{detailsTrainer.address ?? "—"}</dd></div>
                </dl>
                <div className="flex gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => { openEdit(detailsTrainer); setDetailsTrainer(null); }}
                    className="px-4 py-2.5 rounded-xl bg-brand-red hover:opacity-90 text-white font-semibold text-sm"
                  >
                    Edit trainer data
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailsTrainer(null)}
                    className="px-4 py-2.5 rounded-xl border border-white/20 text-stone-400 hover:bg-white/5 text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      <div className="liquid-glass rounded-2xl overflow-hidden">
        {trainers.length === 0 ? (
          <div className="p-8 text-center text-stone-500 text-sm">
            No trainers yet. Add one to get started.
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="py-3 px-4 text-stone-400 font-medium w-14">Photo</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Name</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Phone</th>
                <th className="py-3 px-4 text-stone-400 font-medium">Address</th>
                <th className="py-3 px-4 text-stone-400 font-medium w-28">Action</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-white/5 hover:bg-white/[0.04] cursor-pointer"
                  onClick={() => setDetailsTrainer(t)}
                >
                  <td className="py-2.5 px-4">
                    <img
                      src={t.image ?? "/images/profile placeholder.jpg"}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover border border-white/10"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-stone-100 font-medium">{t.name}</td>
                  <td className="py-2.5 px-4 text-stone-300">{t.phone_number ?? "—"}</td>
                  <td className="py-2.5 px-4 text-stone-300 max-w-[200px] truncate">
                    {t.address ?? "—"}
                  </td>
                  <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openEdit(t)}
                      className="text-brand-red hover:underline text-sm mr-2"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      className="text-stone-500 hover:text-red-400 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
