"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Phone,
  Mail,
  MessageCircle,
  Star,
  ExternalLink,
  MapPin,
} from "lucide-react";
import Image from "next/image";

interface ContactPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReviews: () => void;
}

export function ContactPanel({
  isOpen,
  onClose,
  onOpenReviews,
}: ContactPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="contact-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] dark:bg-black/40"
          />

          {/* Panel */}
          <motion.div
            key="contact-panel"
            initial={{ x: "100%", opacity: 0.7 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0.7 }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl dark:bg-[#14161c]"
            style={{
              borderLeft: "1px solid var(--container-border, rgba(0,0,0,0.08))",
            }}
          >
            {/* ── Header ── */}
            <div className="flex-shrink-0 px-6 pt-6 pb-5 border-b border-gray-100 dark:border-white/8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                    style={{
                      background: "linear-gradient(135deg, #fa4c0c, #ff8c5a)",
                    }}
                  >
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-black text-gray-900 dark:text-white leading-none">
                      Get in Touch
                    </h2>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      We&apos;d love to hear from you
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
                  aria-label="Close contact panel"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Brand strip */}
              <div
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{
                  background: "linear-gradient(135deg, rgba(250,76,12,0.08) 0%, rgba(255,140,90,0.05) 100%)",
                  border: "1px solid rgba(250,76,12,0.12)",
                }}
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                  <Image
                    src="/logo-192.jpg"
                    alt="Swift Type"
                    width={44}
                    height={44}
                  />
                </div>
                <div>
                  <p className="text-[13px] font-black text-gray-900 dark:text-white">
                    Swift<span style={{ color: "#fa4c0c" }}>Type</span>
                  </p>
                  <a
                    href="https://swifttype.com.ng"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-brand-orange hover:underline flex items-center gap-1 mt-0.5"
                  >
                    swifttype.com.ng <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              {/* Section label */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-0.5">
                Contact us directly
              </p>

              {/* Phone */}
              <a
                href="tel:+2349121475179"
                className="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/8 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/15 transition-colors">
                  <Phone size={16} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Phone</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white mt-0.5">
                    +234 912 147 5179
                  </p>
                </div>
                <ExternalLink size={13} className="ml-auto text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/2349121475179"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/8 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366]/15 transition-colors">
                  {/* WhatsApp SVG icon */}
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">WhatsApp</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white mt-0.5">
                    +234 912 147 5179
                  </p>
                </div>
                <ExternalLink size={13} className="ml-auto text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </a>

              {/* Email */}
              <a
                href="mailto:legal@swifttype.com.ng"
                className="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/8 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-orange/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange/15 transition-colors">
                  <Mail size={16} className="text-brand-orange" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Email</p>
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white mt-0.5 truncate">
                    legal@swifttype.com.ng
                  </p>
                </div>
                <ExternalLink size={13} className="ml-auto text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </a>

              {/* Divider */}
              <div className="h-px bg-gray-100 dark:bg-white/6 my-1" />

              {/* Leave a Review CTA */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-0.5">
                Share your experience
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenReviews();
                }}
                className="group w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all border hover:shadow-md"
                style={{
                  background: "linear-gradient(135deg, rgba(250,76,12,0.06), rgba(255,140,90,0.04))",
                  borderColor: "rgba(250,76,12,0.15)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #fa4c0c, #ff8c5a)" }}
                >
                  <Star size={16} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                    Leave a Review
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Your feedback helps us grow
                  </p>
                </div>
                <ExternalLink size={13} className="flex-shrink-0 text-brand-orange/50 group-hover:text-brand-orange transition-colors" />
              </button>

              {/* King Tech Foundation */}
              <div className="h-px bg-gray-100 dark:bg-white/6 my-1" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-0.5">
                Built by
              </p>
              <a
                href="https://kingtech.com.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/8 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/15 transition-colors">
                  <MapPin size={16} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-gray-900 dark:text-white">
                    King Tech Foundation
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 group-hover:underline">
                    kingtech.com.ng
                  </p>
                </div>
                <ExternalLink size={13} className="flex-shrink-0 text-gray-300 group-hover:text-amber-500 transition-colors" />
              </a>
            </div>

            {/* ── Footer ── */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-white/8">
              <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 leading-relaxed">
                Swift Type is live at{" "}
                <a
                  href="https://swifttype.com.ng"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-orange hover:underline font-semibold"
                >
                  swifttype.com.ng
                </a>
                . We typically respond within 24 hours.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
