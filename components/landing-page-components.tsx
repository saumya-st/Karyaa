"use client";

import React from "react";
import Image from "next/image";
import { Check, Clock, Mail, Slack, Calendar } from "lucide-react";

export function FloatingCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-[#141414] border border-[#262626] rounded-2xl p-4 shadow-2xl ${className}`}>
            {children}
        </div>
    );
}

export function TaskCard({
    title,
    completed = false,
    color = "bg-[#6B7A45]",
    progress,
    date,
}: {
    title: string;
    completed?: boolean;
    color?: string;
    progress?: number;
    date?: string;
}) {
    return (
        <div className="mb-3">
            <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={`w-4 h-4 flex-shrink-0 rounded-sm flex items-center justify-center ${color}`}
                    >
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-[#f5f5f5] truncate">{title}</span>
                </div>
                {date && <span className="text-xs text-[#737373] flex-shrink-0">{date}</span>}
            </div>
            {progress !== undefined && (
                <div className="flex items-center gap-2 ml-7 mt-1">
                    <div className="flex-1 h-1.5 bg-[#262626] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#6B7A45] rounded-full transition-all"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    <span className="text-[10px] text-[#737373] flex-shrink-0">{progress}%</span>
                </div>
            )}
        </div>
    );
}

export function GridBackground() {
    return (
        <div className="absolute inset-0 z-0 bg-dot-pattern pointer-events-none opacity-60" />
    );
}

export function LandingNav() {
    return (
        <nav className="flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
                <Image
                    src="/logo.png"
                    alt="Karya Logo"
                    width={60}
                    height={60}
                    className="rounded-xl object-contain"
                    priority
                />
                <span className="text-xl font-bold text-[#f5f5f5] tracking-tight">Karya</span>
            </div>

  

            {/* CTA */}
            <div className="flex items-center gap-4">
                <a href="/login" className="hidden sm:block text-sm font-medium text-[#a3a3a3] hover:text-[#f5f5f5] transition-colors">
                    Sign in
                </a>
                <a
                    href="/register"
                    className="px-5 py-2.5 bg-[#f5f5f5] text-[#0a0a0a] rounded-full text-sm font-semibold hover:bg-[#6B7A45] hover:text-white transition-colors shadow-sm"
                >
                    Get demo
                </a>
            </div>
        </nav>
    );
}
