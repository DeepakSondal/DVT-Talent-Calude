"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

// ── Animated Counter ───────────────────────────────────────────────────────
export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.floor(value);
    const duration = 1200;
    const step = Math.ceil(end / (duration / 16)) || 1;
    
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display.toLocaleString()}{suffix}</span>;
}

// ── KPI Card ───────────────────────────────────────────────────────────────
export interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  sub: string;
  icon: LucideIcon;
  trend?: number;
  color: string;
  delay?: number;
}

export function KpiCard({
  title,
  value,
  sub,
  icon: Icon,
  trend,
  color,
  delay = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-2xl bg-[#0f1117] border border-white/[0.06] p-6 group hover:border-white/[0.12] transition-all duration-300"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-[0.08] ${color}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">
            {title}
          </p>

          <div className="text-3xl font-bold text-white tracking-tight">
            {value}
          </div>

          <p className="text-sm text-zinc-500 mt-1.5">{sub}</p>
        </div>

        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} bg-opacity-10 shrink-0`}>
          <Icon className="w-5 h-5 text-white opacity-80" />
        </div>
      </div>

      {trend !== undefined && (
        <div className={`flex items-center gap-1.5 mt-4 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          <ArrowUpRight className={`w-3.5 h-3.5 ${trend < 0 ? "rotate-180" : ""}`} />
          <span>{Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </motion.div>
  );
}
