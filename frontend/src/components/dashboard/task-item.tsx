"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Timer, AlertCircle, Clock } from "lucide-react";
import type { AgentTask } from "@/lib/api";

export interface TaskFeedItemProps {
  task: AgentTask;
}

const icons: Record<string, any> = {
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  running: <Timer className="w-4 h-4 text-indigo-400 animate-pulse" />,
  failed: <AlertCircle className="w-4 h-4 text-red-400" />,
  pending: <Clock className="w-4 h-4 text-zinc-500" />,
};

const timeAgo = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
};

export function TaskFeedItem({ task }: TaskFeedItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 py-2.5"
    >
      <div className="shrink-0">{icons[task.status] || icons.pending}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300 truncate">{task.agent_name.replace(/_/g, " ")}</p>
        <p className="text-xs text-zinc-600">{task.task_type.replace(/_/g, " ")}</p>
      </div>
      <span className="text-xs text-zinc-600 shrink-0">{timeAgo(task.created_at)}</span>
    </motion.div>
  );
}
