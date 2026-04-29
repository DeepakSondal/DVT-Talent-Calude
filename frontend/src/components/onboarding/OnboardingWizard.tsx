"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Rocket, Building, Mail, Zap, CheckCircle2, ArrowRight, 
    Loader2, ShieldCheck, Link2, LayoutDashboard, Sparkles,
    Globe, Cpu, Database, ChevronRight, Activity, Shield
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { tenantsApi, emailSenderApi, integrationsApi, EmailSenderConfig } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
    onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [tenant, setTenant] = useState<any>({ name: "", logo_url: "" });
    const [emailConfig, setEmailConfig] = useState<EmailSenderConfig>({
        smtp_host: "smtp.gmail.com",
        smtp_port: 587,
        smtp_user: "",
        smtp_password: "",
        sender_name: "",
        sender_email: "",
    });

    useEffect(() => {
        tenantsApi.getMe().then(data => {
            setTenant({ name: data.name, logo_url: data.logo_url || "" });
        }).catch(() => {});
    }, []);

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => Math.max(1, s - 1));

    const handleBranding = async () => {
        if (!tenant.name) return toast.error("Organization name is required");
        setLoading(true);
        try {
            await tenantsApi.updateMe(tenant);
            nextStep();
        } catch {
            toast.error("Failed to initialize branding");
        } finally {
            setLoading(false);
        }
    };

    const handleEmail = async () => {
        if (!emailConfig.smtp_user || !emailConfig.smtp_password) {
             nextStep();
             return;
        }
        setLoading(true);
        try {
            await emailSenderApi.saveConfig(emailConfig);
            toast.success("Outreach Node Configured");
            nextStep();
        } catch (err: any) {
            toast.error("SMTP Configuration Error", { description: "Verify your app-specific password." });
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            await tenantsApi.completeOnboarding();
            toast.success("Swarm Activated", { description: "Your workspace is now live." });
            onComplete();
        } catch {
            toast.error("Finalization error");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: "Nexus", desc: "Identity", icon: Building },
        { id: 2, title: "Signal", desc: "Outreach", icon: Mail },
        { id: 3, title: "Synapse", desc: "Sync", icon: Link2 },
        { id: 4, title: "Launch", desc: "Initiate", icon: Rocket },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4 overflow-y-auto">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-3xl"
            >
                <Card className="shadow-[0_0_100px_rgba(37,99,235,0.15)] border-white/10 bg-slate-900 overflow-hidden rounded-[3rem]">
                    {/* Progress Header */}
                    <div className="bg-slate-950/50 border-b border-white/5 p-8 sm:p-12 pb-8">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-white uppercase">System <span className="text-blue-500 italic">Initialization</span></h2>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Orchestrating Autonomous Swarm v2.4</p>
                                </div>
                            </div>
                            <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">Phase 0{step} / 04</div>
                        </div>

                        <div className="flex items-center gap-4">
                            {steps.map((s) => {
                                const Icon = s.icon;
                                const isActive = step === s.id;
                                const isComplete = step > s.id;
                                return (
                                    <div key={s.id} className="flex-1 space-y-3">
                                        <div className={cn(
                                            "h-1.5 rounded-full transition-all duration-1000",
                                            isComplete ? "bg-blue-500" : isActive ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.5)]" : "bg-white/5"
                                        )} />
                                        <div className={cn(
                                            "flex flex-col gap-0.5 transition-all duration-500",
                                            isActive || isComplete ? "opacity-100" : "opacity-30"
                                        )}>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">{s.title}</span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{s.desc}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-8 sm:p-12 pt-10 min-h-[400px] flex flex-col text-white">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div 
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black uppercase tracking-tight">Nexus <span className="text-blue-500 italic">Identity</span></h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">Establish your workspace anchor. This branding is used by the swarm to personalize microsites and candidate communiqués.</p>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Workspace Designation</label>
                                            <Input 
                                                placeholder="e.g. ACME CORP NEURAL"
                                                value={tenant.name}
                                                onChange={e => setTenant({...tenant, name: e.target.value})}
                                                className="h-16 bg-white/5 border-transparent focus:bg-white/10 focus:ring-2 focus:ring-blue-500/20 text-lg font-black uppercase tracking-tight px-6 rounded-2xl transition-all"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Visual Asset URL (Optional)</label>
                                            <Input 
                                                placeholder="https://assets.acme.com/logo.png"
                                                value={tenant.logo_url}
                                                onChange={e => setTenant({...tenant, logo_url: e.target.value})}
                                                className="h-14 bg-white/5 border-transparent focus:bg-white/10 px-6 rounded-2xl transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-8">
                                        <Button onClick={handleBranding} disabled={loading} className="w-full h-16 text-xs font-black uppercase tracking-[0.3em] bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-2xl shadow-blue-600/20 group">
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                                <>Initialize Node <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-3">
                                        <h3 className="text-3xl font-black uppercase tracking-tight">Signal <span className="text-blue-500 italic">Orchestrator</span></h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed">Connect your outreach gateway. Agents will use this SMTP node to transmit hyper-personalized signals to talent nodes.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Sender Handle</label>
                                            <Input 
                                                placeholder="Sarah at ACME"
                                                value={emailConfig.sender_name}
                                                onChange={e => setEmailConfig({...emailConfig, sender_name: e.target.value})}
                                                className="h-14 bg-white/5 border-transparent focus:bg-white/10 px-6 rounded-2xl transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Return Path</label>
                                            <Input 
                                                placeholder="sarah@acme.com"
                                                value={emailConfig.sender_email}
                                                onChange={e => setEmailConfig({...emailConfig, sender_email: e.target.value})}
                                                className="h-14 bg-white/5 border-transparent focus:bg-white/10 px-6 rounded-2xl transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">SMTP Relay Host</label>
                                        <Input 
                                            placeholder="smtp.gmail.com"
                                            value={emailConfig.smtp_host}
                                            onChange={e => setEmailConfig({...emailConfig, smtp_host: e.target.value})}
                                            className="h-14 bg-white/5 border-transparent focus:bg-white/10 px-6 rounded-2xl transition-all font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Auth Principal</label>
                                            <Input 
                                                placeholder="login@email.com"
                                                value={emailConfig.smtp_user}
                                                onChange={e => setEmailConfig({...emailConfig, smtp_user: e.target.value})}
                                                className="h-14 bg-white/5 border-transparent focus:bg-white/10 px-6 rounded-2xl transition-all font-bold"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Secure Token</label>
                                            <Input 
                                                type="password"
                                                placeholder="••••••••••••"
                                                value={emailConfig.smtp_password}
                                                onChange={e => setEmailConfig({...emailConfig, smtp_password: e.target.value})}
                                                className="h-14 bg-white/5 border-transparent focus:bg-white/10 px-6 rounded-2xl transition-all font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <Button variant="ghost" onClick={prevStep} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/5">Back</Button>
                                        <Button onClick={handleEmail} disabled={loading} className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20">
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Sync"}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div 
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10"
                                >
                                    <div className="space-y-3 text-center">
                                        <div className="w-20 h-20 bg-blue-600/10 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(37,99,235,0.1)]">
                                            <Link2 className="w-10 h-10" />
                                        </div>
                                        <h3 className="text-3xl font-black uppercase tracking-tight">Synapse <span className="text-blue-500 italic">Bridging</span></h3>
                                        <p className="text-sm text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
                                            Sync mission-critical jobs and export talent directly to your primary ATS nodes.
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] hover:border-blue-500/50 transition-all cursor-pointer group text-center space-y-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl mx-auto flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                                <Database className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black uppercase tracking-widest text-xs">Greenhouse</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">Harvest API v2.0</p>
                                            </div>
                                        </div>
                                        <div className="p-8 bg-white/5 border border-white/5 rounded-[2rem] hover:border-blue-500/50 transition-all cursor-pointer group text-center space-y-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl mx-auto flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                                                <Globe className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black uppercase tracking-widest text-xs">Ceipal</p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-white/30">TalentHire Sync</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button variant="ghost" onClick={prevStep} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/5">Back</Button>
                                        <Button onClick={nextStep} className="flex-[2] h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-600/20">
                                            Skip for Now
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div 
                                    key="step4"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-12 py-8 text-center"
                                >
                                    <div className="relative">
                                        <div className="w-28 h-28 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)] relative z-10">
                                            <CheckCircle2 className="w-14 h-14" />
                                        </div>
                                        <motion.div 
                                            animate={{ scale: [1, 1.4, 1], opacity: [0, 0.5, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute inset-0 w-28 h-28 bg-emerald-400 rounded-[2.5rem] mx-auto blur-2xl"
                                        />
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h3 className="text-4xl font-black uppercase tracking-tight leading-none">Swarm <span className="text-emerald-500 italic">Primed.</span></h3>
                                        <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">
                                            Neural nodes are synchronized. You are now authorized to initiate autonomous discovery missions.
                                        </p>
                                    </div>

                                    <div className="pt-6 flex flex-col gap-6">
                                        <Button onClick={handleFinish} disabled={loading} size="lg" className="h-20 text-xs font-black uppercase tracking-[0.4em] rounded-[2rem] bg-white text-slate-900 hover:bg-slate-100 shadow-[0_20px_50px_rgba(255,255,255,0.1)] group">
                                            {loading ? <Loader2 className="w-6 h-6 animate-spin text-slate-900" /> : (
                                                <>
                                                    Enter Command Center
                                                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                                                </>
                                            )}
                                        </Button>
                                        <div className="flex items-center justify-center gap-6 opacity-40">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">SOC2 Type II</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Activity className="w-4 h-4" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">Neural Sync Live</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
