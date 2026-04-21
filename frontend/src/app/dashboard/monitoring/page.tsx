"use client";

import React, { useEffect, useState } from "react";
import { useWebSocket } from "@/providers/websocket-provider";
import { monitoringApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Shield, Zap, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const SignalItem = React.memo(({ s }: { s: any }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-4 text-xs group"
    >
        <span className="text-emerald-900 font-bold">[{s.timestamp}]</span>
        <span className={`font-black uppercase tracking-tighter ${
            s.type.includes('deduplicated') ? 'text-amber-500' : 
            s.type.includes('resolved') ? 'text-blue-400' : 'text-naturalist-moss'
        }`}>
            {s.agent}
        </span>
        <span className="text-naturalist-sage opacity-60 group-hover:opacity-100 transition-opacity">
            {s.message}
        </span>
    </motion.div>
));

const NexusMonitor = () => {
    const [signals, setSignals] = useState<any[]>([]);
    const [mediations, setMediations] = useState<any>({ active_locks: 0, resolved_conflicts: 0 });
    const { lastMessage } = useWebSocket();

    // 1. Initial Hydration: Load history from Redis
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await monitoringApi.getRecentSignals(50);
                const formatted = history.map((s: any, idx: number) => ({
                    ...s,
                    id: s.id || `hist-${idx}-${s.timestamp}`
                }));
                setSignals(formatted);
            } catch (err) {
                console.error("Failed to hydrate Nexus history", err);
            }
        };
        fetchHistory();
        
        const statInterval = setInterval(async () => {
            try {
                const stats = await monitoringApi.getMediations();
                setMediations(stats || { active_locks: 0, resolved_conflicts: 0 });
            } catch {}
        }, 5000);
        
        return () => clearInterval(statInterval);
    }, []);

    // 2. Live Injection: React to Incoming WebSocket Signals
    useEffect(() => {
        if (lastMessage) {
            setSignals(prev => [{ ...lastMessage, id: Date.now() }, ...prev].slice(0, 50));
        }
    }, [lastMessage]);

    return (
        <div className="min-h-screen bg-black text-naturalist-moss font-mono p-8 space-y-8 selection:bg-naturalist-moss/30">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-naturalist-sage/30 pb-6">
                <div className="flex items-center gap-4">
                    <Activity className="w-8 h-8 animate-pulse text-naturalist-moss" />
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase italic">The Nexus</h1>
                        <p className="text-[10px] text-naturalist-sage font-bold uppercase tracking-[0.4em]">Swarm Intelligence Command</p>
                    </div>
                </div>
                <div className="flex gap-8">
                     <div className="text-right">
                        <span className="block text-[10px] uppercase text-emerald-800">Uptime</span>
                        <span className="text-sm font-bold">99.99%</span>
                     </div>
                     <div className="text-right">
                        <span className="block text-[10px] uppercase text-emerald-800">Mediations</span>
                        <span className="text-sm font-bold">14,290</span>
                     </div>
                </div>
            </header>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Nodes", val: "8", icon: Zap },
                    { label: "Throughput", val: "1.2k/hr", icon: Activity },
                    { label: "Conflict Rate", val: "0.4%", icon: AlertCircle },
                    { label: "Safe Mode", val: "ENABLED", icon: Shield }
                ].map((s, i) => (
                    <Card key={i} className="bg-emerald-950/20 border-emerald-900/50 backdrop-blur-md">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] uppercase tracking-widest text-emerald-700">{s.label}</p>
                                <p className="text-xl font-black text-emerald-400">{s.val}</p>
                            </div>
                            <s.icon className="w-5 h-5 text-emerald-800" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Console */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time Stream */}
                <Card className="lg:col-span-2 bg-black border-emerald-900/40 relative overflow-hidden">
                    <CardHeader className="border-b border-emerald-900/40 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs uppercase tracking-widest flex items-center gap-2">
                             <Terminal className="w-4 h-4" /> Swarm Telemetry Stream
                        </CardTitle>
                        <Badge variant="outline" className="border-emerald-800 text-emerald-800 animate-pulse text-[8px]">LIVE FEED</Badge>
                    </CardHeader>
                    <CardContent className="h-[500px] overflow-hidden p-0 relative">
                        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black to-transparent z-10" />
                        <div className="p-6 space-y-2">
                            <AnimatePresence initial={false}>
                                {signals.map((s) => (
                                    <SignalItem key={s.id} s={s} />
                                ))}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>

                {/* Conflict Resolution Log */}
                <Card className="bg-black border-emerald-900/40">
                    <CardHeader className="border-b border-emerald-900/40">
                        <CardTitle className="text-xs uppercase tracking-widest flex items-center gap-2 text-amber-500">
                             <Shield className="w-4 h-4" /> Mediator Cache
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-[10px] text-emerald-900 uppercase font-black">Latest Reconciliations</h4>
                            {[
                                "candidate:john@appleseed.io (Avg: 88)",
                                "company:spacex.com (Deduplicated)",
                                "lead_search:vp_engineering (Merged)"
                            ].map((c, i) => (
                                <div key={i} className="flex items-center gap-3 text-[11px] text-emerald-400/80">
                                     <RefreshCw className="w-3 h-3 text-emerald-800" />
                                     {c}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NexusMonitor;
