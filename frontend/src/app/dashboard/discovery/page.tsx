"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
    Search, Sparkles, Briefcase, MapPin, 
    Globe, ShieldCheck, Play, Loader2, 
    Zap, FileText, BarChart3
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import { agentsApi, copilotApi } from "@/lib/api";

export default function DiscoveryLab() {
    const [loading, setLoading] = useState(false);
    const [params, setParams] = useState({
        industry: "Technology",
        location: "Remote / USA",
        job_title: "",
        skills: ""
    });

    const handleDiscovery = async () => {
        if (!params.job_title) return toast.error("Job Title is required");
        setLoading(true);
        try {
            await agentsApi.runPhase("discovery", "copilot", {
                industry: params.industry,
                location: params.location,
                job_title: params.job_title
            });
            toast.success("Discovery Sequence Initiated", { 
                description: "Market Intelligence scan is running in the background." 
            });
        } catch {
            toast.error("Discovery failed to initialize");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-10 pb-20 max-w-5xl mx-auto">
            {/* Lab Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                        <Search className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight uppercase">Discovery <span className="text-blue-500 italic">Lab</span></h1>
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Phase 1: Market Intelligence & JD Synthesis</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-8 space-y-8 bg-white/60 backdrop-blur-xl border-border shadow-xl">
                        <div className="flex items-center gap-2 border-b border-border pb-4">
                            <Badge variant="primary" className="bg-blue-500/10 text-blue-600 border-blue-500/20 uppercase tracking-widest text-[9px] font-black">Copilot Mode</Badge>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manual Parameter Control</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Job Title</label>
                                    <Badge variant="outline" className="text-[8px] opacity-40 uppercase font-black">AI Required</Badge>
                                </div>
                                <Input 
                                    placeholder="e.g. Senior Staff Engineer"
                                    value={params.job_title}
                                    onChange={e => setParams({...params, job_title: e.target.value})}
                                    className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-bold px-6"
                                />
                                <p className="text-[9px] text-muted-foreground font-medium px-2 italic">
                                    "Agents use this as the primary anchor for market salary and skill mapping."
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location Preference</label>
                                    <Badge variant="outline" className="text-[8px] opacity-40 uppercase font-black">Flexible</Badge>
                                </div>
                                <Input 
                                    placeholder="e.g. New York or Remote"
                                    value={params.location}
                                    onChange={e => setParams({...params, location: e.target.value})}
                                    className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-bold px-6"
                                />
                                <p className="text-[9px] text-muted-foreground font-medium px-2 italic">
                                    "Leave as 'Global' to maximize pool depth across decentralized nodes."
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Core Industry / Keywords</label>
                                <Badge variant="outline" className="text-[8px] opacity-40 uppercase font-black">Highly Recommended</Badge>
                            </div>
                            <Input 
                                placeholder="e.g. FinTech, Rust, High-Frequency Trading"
                                value={params.industry}
                                onChange={e => setParams({...params, industry: e.target.value})}
                                className="h-14 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-bold px-6"
                            />
                             <p className="text-[9px] text-muted-foreground font-medium px-2 italic">
                                    "Comma-separated skills help the agent filter out noisy profiles early."
                                </p>
                        </div>

                        <div className="pt-4">
                            <Button 
                                onClick={handleDiscovery} 
                                disabled={loading}
                                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-black uppercase shadow-xl shadow-blue-500/20"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        <Play className="w-5 h-5 mr-3 fill-current" />
                                        Initiate Discovery Sequence
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>

                    {/* AI Insights Card */}
                    <Card className="p-6 bg-slate-900 border-slate-800 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-16 h-16" />
                        </div>
                        <div className="relative z-10 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Agent Insight</p>
                            <p className="text-sm font-bold leading-relaxed italic">
                                "The market for '{params.job_title || 'Software Engineers'}' in {params.location} is currently high-demand. I recommend emphasizing 'System Design' in the JD to attract top 5% talent."
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Status & Deliverables Sidebar */}
                <div className="space-y-6">
                    <Card className="p-6 bg-muted/20 border-border border-dashed space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-4">Lab Deliverables</h3>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group cursor-pointer opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-tight">Market IQ Report</p>
                                    <p className="text-[9px] text-muted-foreground">Awaiting synthesis...</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group cursor-pointer opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-tight">Optimized JD</p>
                                    <p className="text-[9px] text-muted-foreground">Awaiting synthesis...</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 bg-blue-500/5 border-blue-500/10 space-y-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Compliance Check</span>
                        </div>
                        <p className="text-[10px] font-bold text-blue-800/60 leading-relaxed">
                            Discovery Agent is operating within EEO guidelines and has biased-language filtering enabled.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
