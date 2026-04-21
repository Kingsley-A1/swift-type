"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #f4f6fb 50%, #eef2ff 100%)",
            }}
          >
            {/* Logo Mark */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="flex flex-col items-center gap-6"
            >
              {/* Icon */}
              <motion.div
                animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-[28px] flex items-center justify-center shadow-2xl overflow-hidden"
                  style={{
                    boxShadow: "0 8px 32px rgba(0,0,0,0.10)"
                  }}
                >
                  <Image src="/logo-192.png" alt="SwiftType" width={96} height={96} priority />
                </div>
              </motion.div>

              {/* Brand Text */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-center"
              >
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  Swift<span style={{ color: "#ff6b35" }}>Type</span>
                </h1>
                <p className="text-sm font-medium mt-2" style={{ color: "rgba(15,23,42,0.45)" }}>
                  Train your fingers. Master your keyboard.
                </p>
              </motion.div>

              {/* Loading Dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex gap-2 mt-2"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "#ff6b35" }}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {children}
      </motion.div>
    </>
  );
}
