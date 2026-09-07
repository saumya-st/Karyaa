"use client";

import React from "react";

export function LoaderOne() {
  return (
    <div className="flex items-center gap-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-3 w-3 rounded-full bg-[#a3a3a3]"
          style={{
            animation: "dotBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.3;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Full-screen overlay that renders LoaderOne centered on the viewport.
 */
export function LoaderOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm">
      <LoaderOne />
      {message && (
        <p className="mt-6 text-sm font-medium text-[#525252] tracking-widest uppercase">
          {message}
        </p>
      )}
    </div>
  );
}
