"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Bot, Shield, Target, Zap, 
  Github, Mail, Linkedin, Chrome as Google,
  ArrowRight, Key, Sparkles, UserPlus,
  CheckCircle2
} from "lucide-react";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    company: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.register(formData);
      toast.success("Deployment Successful", {
        description: "Your Intelligence Node has been provisioned.",
        icon: <CheckCircle2 className="w-4 h-4 text-primary" />
      });
      router.push("/auth/login");
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Registration failed.";
      toast.error("Deployment Interrupted", {
         description: typeof msg === 'string' ? msg : "Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-primary/20">
      {/* Naturalist Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-60" />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[540px] relative z-10"
      >
        <Card className="bg-white/80 backdrop-blur-xl border-border/50 shadow-[0_40px_80px_-20px_rgba(132,169,140,0.12)] p-12 space-y-10">
          {/* Naturalist Header */}
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl bg-secondary/30 flex items-center justify-center mx-auto shadow-sm mb-6">
                <UserPlus className="w-7 h-7 text-primary" />
             </div>
             <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic leading-none">Initialize Access</h1>
             <p className="text-muted-foreground font-black text-[10px] tracking-[0.4em] uppercase opacity-60">Deployment Registration / Node Setup</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-8">
            <div className="grid grid-cols-2 gap-5">
              <Input
                label="Full Name"
                placeholder="Commander Name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                required
                className="col-span-1 bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 h-14 font-black text-[11px] tracking-widest placeholder:lowercase placeholder:tracking-normal"
              />
              <Input
                label="Organization"
                placeholder="Intelligence Unit"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="col-span-1 bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 h-14 font-black text-[11px] tracking-widest placeholder:lowercase placeholder:tracking-normal"
              />
              <Input
                label="Registered Email"
                type="email"
                placeholder="operator@dvttalent.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="col-span-2 bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 h-14 font-black text-[11px] tracking-widest placeholder:lowercase placeholder:tracking-normal"
              />
              <Input
                label="Private Access Key"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="col-span-2 bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 h-14 font-black text-xs tracking-widest"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-16 text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-primary/10 active:scale-95 transition-all"
              isLoading={isLoading}
            >
              Confirm Deployment
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
                  className="flex-1 h-14 rounded-2xl bg-secondary/10 border border-transparent hover:bg-white hover:border-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-3 group px-4"
                >
                   <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground">
                      {i === 0 ? "Google" : "LinkedIn"}
                   </span>
                </button>
             ))}
          </div>
          
          <p className="text-center text-[10px] text-muted-foreground pt-4 font-black uppercase tracking-widest">
            Already verified? <Link href="/auth/login" className="text-primary hover:underline underline-offset-4">Identity Bridge</Link>
          </p>
        </Card>

        {/* Technical Health Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex items-center justify-between px-6 opacity-40"
        >
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Seed Node Ready</span>
           </div>
           <div className="flex items-center gap-2">
              <Shield className="w-3 h-3" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">ENCRYPTED LINK 2.0</span>
           </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
