"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Star, ChevronDown, Send, Pencil, Loader2, Quote } from "lucide-react";
import { useSession } from "next-auth/react";
import { REVIEW_ROLES, KEY_ROLES, type ReviewRole } from "@/db/schema";
import clsx from "clsx";

interface ReviewRecord {
  id: string;
  userId: string;
  userName: string;
  userImage: string | null;
  content: string;
  role: string;
  organisation: string | null;
  createdAt: string;
}

interface ReviewsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  Founder:    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  CTO:        "bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20",
  Developer:  "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20",
  Engineer:   "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/20",
  Instructor: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
};
const DEFAULT_BADGE = "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        referrerPolicy="no-referrer"
        className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-white/10 shadow-sm"
      />
    );
  }
  const colors = ["#ff6b35", "#7c3aed", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
      style={{ background: color }}
    >
      {initials(name)}
    </div>
  );
}

function ReviewCard({ review, isOwn }: { review: ReviewRecord; isOwn: boolean }) {
  const badgeClass = ROLE_BADGE_CLASS[review.role] ?? DEFAULT_BADGE;
  const isKeyRole = KEY_ROLES.includes(review.role as ReviewRole);
  const displayOrg = isKeyRole && review.organisation ? review.organisation : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "relative rounded-2xl p-4 flex flex-col gap-3 border transition-all",
        isOwn
          ? "border-brand-orange/30 bg-orange-50/60 dark:bg-orange-500/5"
          : "border-gray-200 dark:border-white/8 bg-white dark:bg-white/3",
      )}
    >
      {/* Quote icon */}
      <Quote
        size={16}
        className="absolute top-3 right-3 text-gray-200 dark:text-white/10"
      />

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Avatar name={review.userName} image={review.userImage} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
            {review.userName}
            {isOwn && (
              <span className="ml-1.5 text-[10px] font-semibold text-brand-orange">(you)</span>
            )}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={clsx("text-[10px] font-semibold px-2 py-0.5 rounded-full border", badgeClass)}>
              {review.role}
            </span>
            {displayOrg && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                · {displayOrg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-[13px] leading-relaxed text-gray-700 dark:text-gray-300">
        {review.content}
      </p>

      {/* Date */}
      <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-auto">
        {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
      </p>
    </motion.div>
  );
}

function ReviewForm({
  existing,
  onSubmit,
  onCancel,
}: {
  existing?: ReviewRecord | null;
  onSubmit: (data: { content: string; role: string; organisation?: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(existing?.content ?? "");
  const [role, setRole] = useState<string>(existing?.role ?? "Swift Typist");
  const [org, setOrg] = useState(existing?.organisation ?? "");
  const [submitting, setSubmitting] = useState(false);

  const showOrgInput = KEY_ROLES.includes(role as ReviewRole);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    await onSubmit({ content, role, organisation: showOrgInput ? org : undefined });
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-brand-orange/25 bg-orange-50/50 dark:bg-orange-500/5 p-4 space-y-3"
    >
      <p className="text-[12px] font-bold text-gray-700 dark:text-gray-300">
        {existing ? "Edit your review" : "Share your experience"}
      </p>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="How has Swift Type helped you? Be honest, be specific."
        className="w-full resize-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2.5 text-[13px] text-gray-800 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:border-brand-orange/40 focus:ring-2 focus:ring-brand-orange/10 transition-all"
      />
      <p className="text-right text-[10px] text-gray-400">{content.length}/500</p>

      {/* Role selector */}
      <div className="relative">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full appearance-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 pr-8 text-[13px] text-gray-700 dark:text-gray-200 outline-none focus:border-brand-orange/40 transition-all cursor-pointer"
        >
          {REVIEW_ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* Organisation input (key roles only) */}
      <AnimatePresence>
        {showOrgInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              maxLength={80}
              placeholder="Organisation (optional but recommended)"
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-2 text-[13px] text-gray-700 dark:text-gray-200 placeholder:text-gray-400 outline-none focus:border-brand-orange/40 transition-all"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 py-2 text-[12px] font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-orange py-2 text-[12px] font-semibold text-white disabled:opacity-50 hover:bg-orange-500 transition-all"
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {existing ? "Update" : "Submit"}
        </button>
      </div>
    </form>
  );
}

export function ReviewsPanel({ isOpen, onClose }: ReviewsPanelProps) {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [myReview, setMyReview] = useState<ReviewRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (!isOpen || fetched.current) return;
    fetched.current = true;
    setLoading(true);
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data: { reviews: ReviewRecord[]; myReview: ReviewRecord | null }) => {
        setReviews(data.reviews ?? []);
        setMyReview(data.myReview ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  async function handleSubmit(data: { content: string; role: string; organisation?: string }) {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const { review } = await res.json() as { review: ReviewRecord };
    setMyReview(review);
    setReviews((prev) => {
      const without = prev.filter((r) => r.userId !== review.userId);
      return [review, ...without];
    });
    setShowForm(false);
  }

  const isAuthed = status === "authenticated";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="reviews-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            key="reviews-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl flex flex-col bg-white dark:bg-[#0f1218] border-l border-gray-200 dark:border-white/8 shadow-2xl"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/8">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Star size={16} className="text-brand-orange" />
                  Community Reviews
                </h2>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 mt-0.5">
                  What typists are saying about Swift Type
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-5">

              {/* Write/Edit review CTA */}
              {isAuthed && !showForm && (
                <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/3 px-4 py-3">
                  <p className="text-[13px] text-gray-600 dark:text-gray-400">
                    {myReview ? "You've shared your thoughts — thank you! 🎉" : "Enjoying Swift Type? Tell the world."}
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-orange text-white text-[12px] font-semibold hover:bg-orange-500 transition-all shrink-0 ml-3"
                  >
                    {myReview ? <Pencil size={12} /> : <Star size={12} />}
                    {myReview ? "Edit" : "Review"}
                  </button>
                </div>
              )}

              {!isAuthed && (
                <div className="rounded-2xl border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/3 px-4 py-3 text-center">
                  <p className="text-[13px] text-gray-500 dark:text-gray-400">
                    Sign in to share your experience with the community.
                  </p>
                </div>
              )}

              {/* Review form */}
              {showForm && (
                <ReviewForm
                  existing={myReview}
                  onSubmit={handleSubmit}
                  onCancel={() => setShowForm(false)}
                />
              )}

              {/* Review grid */}
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 size={20} className="animate-spin text-gray-300" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Star size={32} className="text-gray-200 dark:text-white/10 mb-3" />
                  <p className="text-[14px] font-semibold text-gray-400">No reviews yet</p>
                  <p className="text-[12px] text-gray-300 dark:text-gray-600 mt-1">
                    Be the first to share your experience!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      isOwn={review.userId === session?.user?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
