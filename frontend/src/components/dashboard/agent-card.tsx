"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

export interface Agent {
  key: string;
  label: string;
  icon: string;
  desc: string;
}

export interface AgentCardProps {
  agent: Agent;
  onRun: (key: string) => void;
  isRunning: boolean;
}

export function AgentCard({ agent, onRun, isRunning }: AgentCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-white/[0.05] transition-all cursor-pointer group"
      onClick={() => !isRunning && onRun(agent.key)}
    >
      <span className="text-xl">{agent.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 truncate">{agent.label}</p>
        <p className="text-xs text-zinc-600 truncate">{agent.desc}</p>
      </div>
      
      {isRunning ? (
        <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
      ) : (
        <Play className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
      )}
    </motion.div>
  );
}
