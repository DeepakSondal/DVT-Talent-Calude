"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, Zap, Target, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-20 text-center bg-white/40 border border-dashed border-primary/20 rounded-[3rem] space-y-8 shadow-xl shadow-primary/5 group transition-all duration-700 hover:bg-white"
    >
      <div className="w-24 h-24 rounded-[2.5rem] bg-primary/5 flex items-center justify-center relative shadow-inner group-hover:scale-110 transition-transform duration-700">
        {icon || <Target className="w-10 h-10 text-primary opacity-40" />}
        <motion.div 
          animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute inset-0 bg-primary rounded-full blur-3xl -z-10"
        />
      </div>

      <div className="max-w-md space-y-3">
        <h3 className="text-2xl font-black tracking-tighter text-foreground uppercase italic">{title}</h3>
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-loose opacity-60 italic">{description}</p>
      </div>

      {actionLabel && (
        <Button 
          onClick={onAction} 
          className="rounded-[1.5rem] px-10 h-14 font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-3"
        >
          <Sparkles className="w-4 h-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
