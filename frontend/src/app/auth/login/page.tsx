"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Bot, Shield, Target, Zap, 
  Github, Mail, Linkedin, Chrome as Google,
  ArrowRight, Key, Sparkles, Loader2
} from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const from = searchParams.get("from") || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.login({ email, password });
      toast.success("Identity Verified", {
        description: "Welcome back to your Intelligence Command.",
        icon: <Shield className="w-4 h-4 text-primary" />
      });
      router.push(from);
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Invalid credentials provided.";
      toast.error("Verification Failed", {
         description: typeof msg === 'string' ? msg : "Please check your access key.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-primary/20">
      {/* Naturalist Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60" />
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] relative z-10"
      >
        <Card className="bg-white/80 backdrop-blur-xl border-border/50 shadow-[0_40px_80px_-20px_rgba(132,169,140,0.12)] p-12 space-y-10">
          {/* Naturalist Header */}
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center mx-auto shadow-xl shadow-primary/20 mb-8 transition-transform hover:scale-105 active:scale-95 cursor-pointer">
                <Bot className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none">DVT Talent</h1>
             <p className="text-muted-foreground font-black text-[10px] tracking-[0.4em] uppercase opacity-60">Identity Bridge / Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-5">
              <Input
                label="Registered Email"
                type="email"
                placeholder="operator@dvttalent.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 h-14 font-black text-[11px] tracking-widest placeholder:lowercase placeholder:tracking-normal"
              />
              <div className="space-y-2">
                <Input
                  label="Private Access Key"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 h-14 font-black text-xs tracking-widest"
                />
                <div className="flex justify-end px-1">
                   <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Forgot Key?</Link>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-16 text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/10 active:scale-95 transition-all"
              isLoading={isLoading}
            >
              Initialize Node
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </form>

          <div className="relative pt-6">
             <div className="absolute inset-0 flex items-center px-8">
                <div className="w-full border-t border-border/50" />
             </div>
             <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.5em]">External Protocols</span>
             </div>
          </div>

          <div className="flex gap-4 justify-center">
             {[Google, Linkedin].map((Icon, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login/${i === 0 ? 'google' : 'linkedin'}`}
                  className="flex-1 h-14 rounded-2xl bg-secondary/10 border border-transparent hover:bg-white hover:border-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-3 group px-4"
                >
                   <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground">
                      {i === 0 ? "Google" : "LinkedIn"}
                   </span>
                </button>
             ))}
          </div>

          <div className="pt-2">
            <button 
              type="button"
              onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/sso/login`}
              className="w-full h-14 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-3 group"
            >
               <Key className="w-4 h-4 text-primary group-hover:text-white transition-colors" />
               <span className="text-[10px] font-black uppercase tracking-widest">
                  Enterprise SSO (Okta / Azure)
               </span>
            </button>
          </div>
          
          <p className="text-center text-[10px] text-muted-foreground pt-4 font-black uppercase tracking-widest">
            New operator? <Link href="/auth/register" className="text-primary hover:underline underline-offset-4">Request Deployment</Link>
          </p>
        </Card>

        {/* Technical Health Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex items-center justify-between px-6"
        >
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">Neural Bridge Ready</span>
           </div>
           <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">SECURE LINK v2.0</span>
           </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
