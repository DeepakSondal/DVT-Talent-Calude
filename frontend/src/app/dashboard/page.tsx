"use client";

import { useEffect, useState } from "react";
import { 
  Zap, Activity, Users, Target, 
  TrendingUp, ArrowUpRight, 
  Calendar, AlertCircle, Loader2, Mail,
  CheckCircle2, Clock, Settings2, RefreshCw,
  ChevronRight, BarChart3, PieChart,
  History, Rocket, ShieldCheck,
  Timer, BrainCircuit, Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Radar, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { analyticsApi, agentsApi, type DashboardKPIs } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useWebSocket } from "@/providers/websocket-provider";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface PipelineEvent {
  type: string;
  agent: string;
  message: string;
  timestamp: string;
  metadata?: any;
}

// ── Mock Data for Premium Feel ─────────────────────────────────────────────
const VELOCITY_DATA = [
  { name: "Week 1", value: 400 },
  { name: "Week 2", value: 300 },
  { name: "Week 3", value: 600 },
  { name: "Week 4", value: 800 },
  { name: "Week 5", value: 500 },
  { name: "Week 6", value: 900 },
  { name: "Week 7", value: 1200 },
];

const RADAR_DATA = [
  { subject: 'Sourcing Speed', A: 120, fullMark: 150 },
  { subject: 'Engagement %', A: 98, fullMark: 150 },
  { subject: 'Cost Efficiency', A: 86, fullMark: 150 },
  { subject: 'Retention Pred.', A: 99, fullMark: 150 },
  { subject: 'Skill Match', A: 85, fullMark: 150 },
  { subject: 'Culture Fit', A: 65, fullMark: 150 },
];

const CHART_COLORS = {
  primary: '#2563eb', // Nordic Blue
  accent: '#7dd3fc', // Sky
  success: '#10b981', 
  warning: '#f59e0b'
};

const CONVERSION_FUNNEL = [
  { label: 'Market Scanned', value: '42,902', percent: 100, color: 'bg-white/5' },
  { label: 'Qualified Leads', value: '8,421', percent: 19.6, color: 'bg-primary/20' },
  { label: 'Engaged Talent', value: '2,105', percent: 25, color: 'bg-emerald-500/20' },
  { label: 'Placed/Won', value: '432', percent: 20.5, color: 'bg-emerald-500' },
];

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [executing, setExecuting] = useState(false);
  const { lastMessage } = useWebSocket();
  const [events, setEvents] = useState<PipelineEvent[]>([]);

  // Update events feed when a new message arrives via WebSocket
  useEffect(() => {
    if (lastMessage && (lastMessage.type === "agent_started" || lastMessage.type === "agent_completed" || lastMessage.type === "agent_error")) {
      setEvents(prev => [lastMessage as PipelineEvent, ...prev].slice(0, 10));
    }
  }, [lastMessage]);

  const handleRunPipeline = async () => {
    try {
      setExecuting(true);
      await agentsApi.runPipeline({ industry: "technology", location: "United States", send_emails: false });
      toast.success("Autonomous Pipeline Triggered", { description: "Swarm has been dispatched." });
    } catch (err) {
      toast.error("Failed to execute pipeline.");
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    analyticsApi.dashboard(30)
      .then(setKpis)
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-12 pb-20 mt-10 md:mt-0"
    >
      {/* Header Area */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="space-y-1.5 font-sans">
          <Badge variant="primary" className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20">Executive Overview</Badge>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">Command Center</h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm uppercase tracking-widest leading-none mt-1">Real-time Autonomous Talent Orchestration</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="secondary" className="bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300">
             <ArrowUpRight className="w-4 h-4 mr-2" />
             Audit Logs
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 text-white"
            onClick={handleRunPipeline}
            disabled={executing}
            isLoading={executing}
          >
             <Zap className="w-4 h-4 mr-2" />
             Run Pipeline
          </Button>
        </div>
      </header>

      {/* Hero ROI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="p-8 border-blue-100 dark:border-blue-500/20 bg-blue-50/10 dark:bg-blue-500/5 relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-500/40 transition-all shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[60px] pointer-events-none" />
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <Timer className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <Badge variant="primary" className="dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">Target Achieved</Badge>
               </div>
               <div className="space-y-1">
                  <h3 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">428h</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Human Hours Saved / Month</p>
               </div>
               <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                     <TrendingUp className="w-3 h-3" />
                     +14% Increase
                  </span>
                  <span className="text-[10px] font-black text-slate-300 dark:text-white/10 uppercase">vs Last Period</span>
               </div>
            </div>
         </Card>

         <Card variant="solid" className="p-8 relative overflow-hidden group transition-all bg-white dark:bg-white/5 border-slate-100 dark:border-white/10">
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <BrainCircuit className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                  <Badge variant="success" className="dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">Continuous Engine</Badge>
               </div>
               <div className="space-y-1">
                  <h3 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">92%</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Autonomous Sourcing Efficiency</p>
               </div>
               <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                     Precision: 0.94
                  </span>
                  <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
               </div>
            </div>
         </Card>

         <Card variant="solid" className="p-8 relative overflow-hidden group transition-all bg-white dark:bg-white/5 border-slate-100 dark:border-white/10">
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <Globe className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  <Badge variant="outline" className="dark:border-white/10 dark:text-slate-400">Global Network</Badge>
               </div>
               <div className="space-y-1">
                  <h3 className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white">12.4k</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Active Talent Nodes Synced</p>
               </div>
               <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1">
                     Latency: 140ms
                  </span>
                  <RefreshCw className="w-3 h-3 text-slate-200 dark:text-white/10 animate-spin-slow" />
               </div>
            </div>
         </Card>
      </div>

      {/* Deep Analytics Grid */}
      <div className="grid grid-cols-12 gap-10">
         
         {/* Flywheel Intensity Radar */}
         <Card className="col-span-12 lg:col-span-5 p-10 bg-white border-slate-100 space-y-10 relative overflow-hidden group shadow-sm">
            <div className="flex flex-col gap-2">
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Flywheel Performance</h3>
               <h2 className="text-2xl font-black text-slate-900">Autonomous Intensity</h2>
            </div>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'black' }} />
                    <Radar
                       name="Intelligence"
                       dataKey="A"
                       stroke={CHART_COLORS.primary}
                       fill={CHART_COLORS.primary}
                       fillOpacity={0.15}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                     />
                  </RadarChart>
               </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 font-medium italic text-center">Intensity shows operational depth across core AI recruiting modules.</p>
         </Card>

         {/* Pipeline conversion */}
         <div className="col-span-12 lg:col-span-7 space-y-10">
            <div className="flex flex-col gap-2">
               <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600">Yield Management</h3>
               <h2 className="text-2xl font-black text-slate-900 dark:text-white">Commercial Conversion Funnel</h2>
            </div>
            <div className="space-y-4">
               {CONVERSION_FUNNEL.map((step, i) => (
                  <div key={step.label} className="relative group">
                     <Card 
                        className={cn(
                           "h-20 border-slate-100 dark:border-white/5 flex items-center justify-between px-10 transition-all duration-700 bg-slate-50 dark:bg-white/5 shadow-sm",
                           "hover:border-blue-200 dark:hover:border-blue-500/50"
                        )}
                        style={{ width: `${100 - (i * 8)}%`, marginLeft: `${i * 4}%` }}
                     >
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{step.label}</p>
                           <p className="text-xl font-black text-slate-900 dark:text-white">{step.value}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <span className="text-lg font-black text-slate-500 dark:text-slate-400">{step.percent}%</span>
                           {i > 0 && <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Conversion</span>}
                        </div>
                     </Card>
                  </div>
               ))}
            </div>
         </div>
         
         {/* Live Intelligence Activity Feed */}
         <Card className="col-span-12 p-10 bg-white dark:bg-white/5 border-slate-100 dark:border-white/10 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col gap-1">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Intelligence Stream</h3>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white">Live Pipeline Signal Engine</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">System Online</span>
              </div>
            </div>
            
            <div className="space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
              {events.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-300 dark:text-white/10 gap-3 border-2 border-dashed border-slate-50 dark:border-white/5 rounded-3xl">
                   <Zap className="w-8 h-8" />
                   <p className="text-xs font-bold uppercase tracking-widest">Waiting for Intelligence Signals...</p>
                </div>
              ) : (
                events.map((event, i) => (
                  <motion.div
                    key={event.timestamp + i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
                      event.type === 'agent_error' 
                        ? "bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20" 
                        : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                         "w-10 h-10 rounded-full flex items-center justify-center text-white",
                         event.type === 'agent_started' ? "bg-blue-500" : 
                         event.type === 'agent_completed' ? "bg-emerald-500" : "bg-red-500"
                      )}>
                        {event.type === 'agent_started' ? <History className="w-5 h-5" /> : 
                         event.type === 'agent_completed' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Agent: {event.agent}</p>
                           <span className="text-[10px] font-bold text-slate-300 dark:text-white/10">•</span>
                           <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{event.message}</p>
                      </div>
                    </div>
                    {event.metadata?.duration && (
                       <Badge variant="outline" className="w-fit h-fit border-slate-200 dark:border-white/10 text-[10px] font-black uppercase">
                         {event.metadata.duration}s
                       </Badge>
                    )}
                  </motion.div>
                ))
              )}
            </div>
         </Card>
      </div>

      {/* ROI Over Time Area Chart */}
      <Card className="p-0 border-slate-100 bg-white overflow-hidden group shadow-sm">
         <div className="p-10 border-b border-slate-50 flex items-end justify-between">
            <div className="space-y-2">
               <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Sourcing Alpha Velocity</h2>
               <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Growth in automated talent acquisition cycles
               </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
               {['7D', '30D', '90D', 'ALL'].map(t => (
                  <button key={t} className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", t === '30D' ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-900")}>
                     {t}
                  </button>
               ))}
            </div>
         </div>
         <div className="h-[400px] w-full p-10">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={VELOCITY_DATA}>
                  <defs>
                     <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                     dataKey="name" 
                     stroke="#94a3b8" 
                     fontSize={10} 
                     fontWeight="black"
                     tickLine={false} 
                     axisLine={false} 
                     dy={15}
                  />
                  <YAxis 
                     stroke="#94a3b8" 
                     fontSize={10} 
                     fontWeight="black"
                     tickLine={false} 
                     axisLine={false} 
                     dx={-15}
                  />
                  <Tooltip 
                     contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                     itemStyle={{ color: "#1e293b", fontWeight: "black" }}
                  />
                  <Area 
                     type="monotone" 
                     dataKey="value" 
                     stroke={CHART_COLORS.primary} 
                     strokeWidth={3}
                     fillOpacity={1} 
                     fill="url(#colorValue)" 
                     animationDuration={2000}
                  />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </Card>
    </motion.div>
  );
}
