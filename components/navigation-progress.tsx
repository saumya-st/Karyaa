"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const prevPathname = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    // Start the bar
    setWidth(0);
    setVisible(true);

    // Animate to ~80% quickly, then stall
    rafRef.current = requestAnimationFrame(() => {
      setWidth(30);
      timerRef.current = setTimeout(() => setWidth(70), 100);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pathname]);

  // When pathname settles (component has mounted with new route) → complete bar
  useEffect(() => {
    if (!visible) return;
    setWidth(100);
    const t = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible && width === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
      style={{ background: "transparent" }}
    >
      <div
        className="h-full bg-[#6B7A45] transition-all ease-out"
        style={{
          width: `${width}%`,
          transitionDuration: width === 100 ? "200ms" : width === 0 ? "0ms" : "600ms",
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
