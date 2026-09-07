import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Clock, Mail, Slack, Calendar, ArrowRight } from "lucide-react";
import {
  LandingNav,
  GridBackground,
  FloatingCard,
  TaskCard,
} from "@/components/landing-page-components";

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] relative overflow-hidden">
      <GridBackground />

      {/* ── Navbar ── */}
      <LandingNav />

      {/* ── Hero ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-36">
        <div className="relative z-20 flex flex-col items-center text-center">

          {/* Center logo icon */}
          <div className="mb-8 bg-[#141414] border border-[#262626] rounded-2xl shadow-lg p-3 inline-flex items-center justify-center gap-3">
            <Image
              src="/logo.png"
              alt="Karya Logo"
              width={60}
              height={60}
              className="object-contain rounded-xl"
              priority
            />
            <span className="text-2xl font-bold text-[#f5f5f5] tracking-tight pr-2">Karya</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight mb-4">
            Think, plan, and track
            <br />
            <span className="text-[#525252]">all in one place</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-[#a3a3a3] max-w-xl mx-auto mb-10">
            Karya helps you efficiently manage tasks and boost productivity.
          </p>

          {/* CTA */}
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#6B7A45] text-white text-base font-semibold rounded-full hover:bg-[#4e5a31] transition-colors shadow-md shadow-[#6B7A45]/30"
          >
            Get free demo
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* ── Floating Cards ─ Desktop only (z-10, below hero text) ── */}

        {/* Top-left: Sticky note */}
        <FloatingCard className="absolute top-36 left-4 xl:left-12 hidden lg:block w-56 -rotate-3 hover:rotate-0 transition-transform duration-500 z-10 bg-[#1c1a0e] border-[#3d3810]">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-400" />
          </div>
          <p className="text-sm font-medium leading-relaxed text-[#c4b85a] italic">
            "Take notes to keep track of crucial details, and accomplish more tasks with ease."
          </p>
        </FloatingCard>

        {/* Top-right: Reminders */}
        <FloatingCard className="absolute top-28 right-4 xl:right-12 hidden lg:block w-72 rotate-3 hover:rotate-0 transition-transform duration-500 z-10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-[#f5f5f5]">Reminders</h4>
            <Clock className="w-4 h-4 text-[#737373]" />
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#262626]">
              <p className="text-xs font-bold text-[#f5f5f5] mb-0.5">Today's Meeting</p>
              <p className="text-[11px] text-[#737373]">Call with marketing team</p>
              <div className="flex items-center gap-1 mt-2 text-[#6B7A45] font-semibold text-[11px]">
                <Clock className="w-3 h-3" />
                13:00 – 13:45
              </div>
            </div>
            <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#262626]">
              <p className="text-xs font-bold text-[#f5f5f5] mb-0.5">Meetings</p>
              <p className="text-[11px] text-[#737373]">Time</p>
            </div>
          </div>
        </FloatingCard>

        {/* Bottom-left: Today's tasks */}
        <FloatingCard className="absolute bottom-16 left-4 xl:left-12 hidden lg:block w-72 rotate-2 hover:rotate-0 transition-transform duration-500 z-10">
          <h4 className="text-sm font-bold text-[#f5f5f5] mb-4">Today's tasks</h4>
          <TaskCard title="New ideas for campaign" color="bg-orange-400" progress={60} date="Sep 10" />
          <TaskCard title="Design PPT #4" color="bg-[#6B7A45]" progress={112} date="Sep 18" />
        </FloatingCard>

        {/* Bottom-right: Integrations */}
        <FloatingCard className="absolute bottom-20 right-4 xl:right-12 hidden lg:block w-64 -rotate-2 hover:rotate-0 transition-transform duration-500 z-10">
          <h4 className="text-sm font-bold text-[#f5f5f5] mb-4">100+ Integrations</h4>
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-[#262626] shadow-sm">
              <Mail className="w-6 h-6 text-red-500" />
            </div>
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-[#262626] shadow-sm">
              <Slack className="w-6 h-6 text-[#6B7A45]" />
            </div>
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-xl flex items-center justify-center border border-[#262626] shadow-sm">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </FloatingCard>

        {/* ── Mobile fallback card ── */}
        <div className="mt-16 lg:hidden flex justify-center">
          <FloatingCard className="w-full max-w-sm p-6">
            <h4 className="font-bold mb-4 text-[#f5f5f5]">Plan your day</h4>
            <TaskCard title="Review project scope" color="bg-[#6B7A45]" />
            <TaskCard title="Team sync at 2 PM" color="bg-[#6B7A45]" progress={100} />
            <TaskCard title="Update documentation" color="bg-gray-300" />
          </FloatingCard>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-[#262626] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Karya Logo" width={36} height={36} className="rounded-lg object-contain" />
            <span className="text-sm font-semibold text-[#f5f5f5]">Karya</span>
          </div>
          <p className="text-sm text-[#737373]">
            © 2026 Karya. All rights reserved. Built for modern teams.
          </p>
          <div className="flex items-center gap-6 text-sm text-[#737373]">
            <a href="/privacy" className="hover:text-[#f5f5f5] transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#f5f5f5] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
