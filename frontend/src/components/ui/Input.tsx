import * as React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pl-1">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest pl-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
