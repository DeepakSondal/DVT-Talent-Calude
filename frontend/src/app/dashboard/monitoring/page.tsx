"use client";

import React, { useEffect, useState } from "react";
import { useWebSocket } from "@/providers/websocket-provider";
import { monitoringApi, agentsApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Shield, Zap, Activity, AlertCircle, RefreshCw, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

const SignalItem = React.memo(({ s }: { s: any }) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-3 text-sm py-2 group border-b border-slate-50 last:border-0"
    >
        <span className="text-slate-400 font-medium whitespace-nowrap">[{s.timestamp.split('T')[1]?.substring(0, 8) || new Date(s.timestamp).toLocaleTimeString()}]</span>
        <span className={`font-semibold capitalize w-32 shrink-0 ${
            s.type?.includes('deduplicated') ? 'text-amber-600' : 
            s.type?.includes('resolved') ? 'text-blue-600' : 'text-slate-900'
        }`}>
            {s.agentName || s.agent || "System"}
        </span>
        <span className="text-slate-600 flex-1">
            {s.message}
        </span>
    </motion.div>
));

const NexusMonitor = () => {
    const [signals, setSignals] = useState<any[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [mediations, setMediations] = useState<any>({ active_locks: 0, resolved_conflicts: 0, latest_reconciliation: "" });
    const { lastMessage } = useWebSocket();

    // 1. Initial Hydration: Load history from Redis/Tasks
    useEffect(() => {
        const fetchRealData = async () => {
            try {
                // Fetch real signals
                const history = await monitoringApi.getRecentSignals(50);
                const formattedSignals = history.map((s: any, idx: number) => ({
                    ...s,
                    id: s.id || `hist-${idx}-${s.timestamp}`
                }));
                setSignals(formattedSignals);

                // Fetch real task execution status instead of mock "8 active nodes"
                const taskData = await agentsApi.listTasks(100);
                setTasks(taskData.tasks || []);

                // Fetch mediations
                const stats = await monitoringApi.getMediations();
                setMediations(stats || { active_locks: 0, resolved_conflicts: 0 });
            } catch (err) {
                console.error("Failed to hydrate monitoring data", err);
            }
        };
        fetchRealData();
        
        const statInterval = setInterval(fetchRealData, 10000);
        return () => clearInterval(statInterval);
    }, []);

    // 2. Live Injection: React to Incoming WebSocket Signals
    useEffect(() => {
        if (lastMessage) {
            setSignals(prev => [{ 
                ...lastMessage, 
                id: Date.now(), 
                timestamp: new Date().toISOString() 
            }, ...prev].slice(0, 50));
        }
    }, [lastMessage]);

    // Calculate real stats from actual tasks
    const activeTasks = tasks.filter(t => t.status === "running" || t.status === "pending").length;
    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const errorTasks = tasks.filter(t => t.status === "failed").length;
    const taskSuccessRate = tasks.length > 0 ? (((tasks.length - errorTasks) / tasks.length) * 100).toFixed(1) : "100.0";

    return (
        <div className="space-y-8 pb-10">
            {/* ROI & Executive Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-emerald-600 text-white border-none shadow-xl shadow-emerald-500/20">
                    <CardContent className="p-8 space-y-2">
                        <div className="flex items-center gap-2 opacity-80">
                            <Zap className="w-4 h-4" />
                            <p className="text-xs font-black uppercase tracking-widest">Recruiting Time Saved</p>
                        </div>
                        <p className="text-4xl font-black">{Math.floor(completedTasks * 1.5)}h</p>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Est. 1.5h saved per synthesis run</p>
                    </CardContent>
                </Card>
                
                <Card className="bg-indigo-600 text-white border-none shadow-xl shadow-indigo-500/20">
                    <CardContent className="p-8 space-y-2">
                        <div className="flex items-center gap-2 opacity-80">
                            <DollarSign className="w-4 h-4" />
                            <p className="text-xs font-black uppercase tracking-widest">Est. Cost Savings</p>
                        </div>
                        <p className="text-4xl font-black">${(completedTasks * 1.5 * 45).toLocaleString()}</p>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Based on $45/hr average recruiter cost</p>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardContent className="p-8 space-y-2">
                        <div className="flex items-center gap-2 opacity-80">
                            <Activity className="w-4 h-4" />
                            <p className="text-xs font-black uppercase tracking-widest">Market IQ Velocity</p>
                        </div>
                        <p className="text-4xl font-black">{tasks.length > 0 ? (completedTasks / (tasks.length || 1) * 100).toFixed(1) : "0"}%</p>
                        <p className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Synthesis Efficiency Rating</p>
                    </CardContent>
                </Card>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Live Telemetry</h1>
                        <p className="text-sm text-slate-500 mt-1">Real-time pipeline monitoring and resource utilization.</p>
                    </div>
                </div>
                <div className="flex gap-8">
                     <div className="text-right">
                        <span className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">Sync Status</span>
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           Operational
                        </span>
                     </div>
                     <div className="text-right">
                        <span className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">Total Actions</span>
                        <span className="text-sm font-bold text-slate-900">{tasks.length}</span>
                     </div>
                </div>
            </div>

            {/* Real Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Pipelines", val: activeTasks.toString(), icon: Zap, color: "text-indigo-600" },
                    { label: "Success Rate", val: `${taskSuccessRate}%`, icon: Activity, color: "text-emerald-600" },
                    { label: "Failed Tasks", val: errorTasks.toString(), icon: AlertCircle, color: errorTasks > 0 ? "text-red-500" : "text-slate-400" },
                    { label: "Total Completed", val: completedTasks.toString(), icon: Shield, color: "text-blue-600" }
                ].map((s, i) => (
                    <Card key={i} className="bg-white border border-slate-200 shadow-sm rounded-xl">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</p>
                                <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.val}</p>
                            </div>
                            <s.icon className={cn("w-6 h-6", s.color)} />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Console */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time Stream */}
                <Card className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden relative">
                    <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4 bg-slate-50/50">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800">
                             <Terminal className="w-4 h-4 text-slate-400" /> Swarm Telemetry Stream
                        </CardTitle>
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 animate-pulse px-2 py-0">LIVE FEED</Badge>
                    </CardHeader>
                    <CardContent className="h-[500px] overflow-y-auto p-0 relative scrollbar-none">
                        <div className="p-6 pt-2">
                            <AnimatePresence initial={false}>
                                {signals.length > 0 ? signals.map((s) => (
                                    <SignalItem key={s.id} s={s} />
                                )) : (
                                    <div className="text-center py-20 text-slate-400 text-sm font-medium">Awaiting incoming signals...</div>
                                )}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>

                {/* Conflict Resolution Log */}
                <Card className="bg-white border border-slate-200 shadow-sm rounded-xl">
                    <CardHeader className="border-b border-slate-100 py-4 bg-slate-50/50">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-800">
                             <Shield className="w-4 h-4 text-slate-400" /> State Mediations
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs text-slate-400 uppercase font-bold tracking-wider">Latest Reconciliations</h4>
                            
                            {/* We pull the REAL recent tasks rather than mock data */}
                            {tasks.slice(0, 5).map((t, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
                                     <RefreshCw className={cn("w-4 h-4", t.status === "completed" ? "text-emerald-500" : "text-indigo-500")} />
                                     <span className="truncate">{t.task_type} - {t.status}</span>
                                </div>
                            ))}
                            
                            {tasks.length === 0 && (
                                <div className="text-sm text-slate-400">No recent state mediations.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NexusMonitor;
