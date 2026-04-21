"use client";

import { motion } from "framer-motion";
import { 
  Users, Target, Building2, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Zap, Sparkles,
  Bot, Clock, Search, ChevronRight, Globe,
  ShieldCheck, BrainCircuit, Rocket, Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { analyticsApi, agentsApi } from "@/lib/api";
import { useWebSocket } from "@/providers/websocket-provider";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function DashboardPage() {
  const [days, setDays] = useState(30);
  const { lastMessage, isConnected } = useWebSocket();
  const [signals, setSignals] = useState<any[]>([]);
  const [activeAgents, setActiveAgents] = useState<any[]>([
    { name: "Scout Agent", task: "Awaiting initialization", state: "Idle", icon: Search },
    { name: "Synthesizer", task: "Idle", state: "Standby", icon: Sparkles },
    { name: "Outreach Lead", task: "Standby", state: "Ready", icon: Rocket },
    { name: "Analyst", task: "Ready", state: "Idle", icon: TrendingUp }
  ]);

  const { data: kpis, isLoading, isError } = useQuery({
    queryKey: ["dashboard-kpis", days],
    queryFn: () => analyticsApi.dashboard(days),
    refetchInterval: 60000, 
  });

  // Handle incoming signals from the backend
  useEffect(() => {
    if (lastMessage) {
      // Add to timeline
      setSignals(prev => [{
        time: "Just now",
        type: lastMessage.type.split('_').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
        msg: lastMessage.message,
        tags: [lastMessage.type === "agent_success" ? "Success" : "Update"],
        timestamp: new Date()
      }, ...prev].slice(0, 5));

      // Update Agent State
      if (lastMessage.type === "agent_success" || lastMessage.type === "pipeline_start") {
         setActiveAgents(prev => {
            const next = [...prev];
            // Mock logic to rotate "active" agent for visual effect based on signal
            const activeIndex = Math.floor(Math.random() * next.length);
            next[activeIndex].state = "Active";
            next[activeIndex].task = lastMessage.message;
            // Set others to idle
            next.forEach((a, i) => { if (i !== activeIndex) a.state = "Idle"; });
            return next;
         });
      }
    }
  }, [lastMessage]);

  const stats = [
    { 
      label: "Market Intelligence", 
      value: kpis?.leads?.total || 0, 
      change: kpis?.leads?.new_this_period || 0,
      trend: "up",
      icon: Target,
      color: "text-primary"
    },
    { 
      label: "Talent Synthesis", 
      value: kpis?.candidates?.total || 0, 
      change: kpis?.candidates?.new_this_period || 0,
      trend: "up",
      icon: Users,
      color: "text-emerald-600"
    },
    { 
      label: "Growth Velocity", 
      value: `${kpis?.leads?.win_rate || 0}%`, 
      change: "+2.4%",
      trend: "up",
      icon: Zap,
      color: "text-amber-500"
    },
    { 
      label: "Active Pipelines", 
      value: (kpis?.companies?.total || 0) + (kpis?.interviews?.scheduled || 0), 
      change: kpis?.companies?.new_this_period || 0,
      trend: "up",
      icon: Building2,
      color: "text-indigo-600"
    }
  ];

  return (
    <SidebarLayout>
      <div className="space-y-12 pb-20">
        {/* Naturalist Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-3">
              <Badge variant="primary" className="py-1 px-4 text-[9px] font-black border-primary/20 bg-primary/5">
                 <BrainCircuit className="w-3 h-3 mr-2 inline" />
                 Pulse Check: {isConnected ? "v2.0.4 Online" : "Connecting..."}
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground leading-none">
                 Intelligence <span className="text-primary italic">Command</span>
              </h1>
              <p className="text-muted-foreground font-bold text-lg max-w-xl">
                 Monitoring autonomous agents as they grow your talent ecosystem in real-time.
              </p>
           </div>
           <div className="flex bg-secondary/20 p-1.5 rounded-2xl border border-border/20">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    days === d ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {d}D
                </button>
              ))}
           </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {stats.map((stat, i) => (
             <motion.div
               key={stat.label}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
             >
                <Card className="p-8 group">
                   <div className="flex items-center justify-between mb-6">
                      <div className={cn("w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center transition-colors group-hover:bg-primary/10", stat.color)}>
                         <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                         <span className="text-[10px] font-black text-emerald-600">+{stat.change}</span>
                         <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                      <h3 className="text-4xl font-black text-foreground tracking-tighter">
                         {isLoading ? "---" : stat.value}
                      </h3>
                   </div>
                </Card>
             </motion.div>
           ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
           {/* Growth Funnel Visualization */}
           <motion.div {...fadeIn} className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Market Conversion Funnel
                 </h3>
                 <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline px-4 py-2 bg-primary/5 rounded-xl transition-all">Details</button>
              </div>
              <Card className="p-10 h-[400px] flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                       <path d="M0 0 L100 0 L80 100 L20 100 Z" fill="currentColor" className="text-primary" />
                    </svg>
                 </div>
                 
                 <div className="w-full max-w-lg space-y-4 relative z-10">
                    {[
                      { label: "Market Discovery", value: (kpis?.companies?.total || 0) * 10, percent: 100, color: "bg-primary" },
                      { label: "High-Intent Matches", value: kpis?.leads?.total || 0, percent: 65, color: "bg-primary/80" },
                      { label: "Agent Outreach", value: kpis?.outreach?.emails_sent || 0, percent: 45, color: "bg-primary/60" },
                      { label: "Natural Responses", value: kpis?.outreach?.emails_replied || 0, percent: 30, color: "bg-emerald-500/60" },
                      { label: "Handed to Human", value: kpis?.leads?.won || 0, percent: 15, color: "bg-emerald-500" }
                    ].map((step, i) => (
                       <div key={step.label} className="space-y-2">
                          <div className="flex justify-between items-end">
                             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{step.label}</span>
                             <span className="text-xs font-black text-foreground">{step.value}</span>
                          </div>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${step.percent}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className={cn("h-3 rounded-full shadow-inner", step.color)} 
                          />
                       </div>
                    ))}
                 </div>
              </Card>
           </motion.div>

           {/* Active Agent Nodes */}
           <motion.div {...fadeIn} className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                    <Bot className="w-5 h-5 text-primary" />
                    Active Agents
                 </h3>
                 <Badge variant="outline" className={cn("animate-pulse", isConnected ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20" : "bg-rose-500/5 text-rose-500 border-rose-500/20")}>
                   {isConnected ? "Operational" : "Offline"}
                 </Badge>
              </div>
              <Card className="divide-y divide-border/20">
                 {activeAgents.map((agent, i) => (
                    <div key={agent.name} className="p-5 flex items-center gap-5 hover:bg-secondary/5 transition-colors cursor-pointer group">
                       <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <agent.icon className="w-5 h-5" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-black text-foreground uppercase tracking-tight">{agent.name}</h4>
                          <p className="text-[9px] font-bold text-muted-foreground truncate italic">{agent.task}</p>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className={cn(
                             "text-[8px] font-black uppercase tracking-widest",
                             agent.state === "Active" ? "text-emerald-500" : "text-muted-foreground"
                          )}>{agent.state}</span>
                          <div className="flex gap-1">
                             <div className="w-3 h-1 rounded-full bg-primary/20 overflow-hidden">
                                {agent.state === "Active" && (
                                   <motion.div 
                                      animate={{ x: [-12, 12] }}
                                      transition={{ repeat: Infinity, duration: 1 }}
                                      className="w-4 h-full bg-primary" 
                                   />
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
                 <div className="p-4 border-t border-border/20">
                    <Button variant="outline" className="w-full text-[10px] font-black" onClick={() => agentsApi.runPipeline({ industry: "Technology", location: "Global", send_emails: false })}>
                       <Plus className="w-3 h-3 mr-2" />
                       Deploy Seed Node
                    </Button>
                 </div>
              </Card>
           </motion.div>
        </div>

        {/* Global Activity Feed */}
        <motion.section {...fadeIn} className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight flex items-center gap-3">
                 <Clock className="w-5 h-5 text-primary" />
                 Growth Timeline
              </h3>
              <div className="flex items-center gap-4">
                 <Button variant="secondary" size="sm" className="h-8">Export Log</Button>
              </div>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6">
              {signals.length > 0 ? signals.map((ev, i) => (
                 <Card key={i} className="p-6 space-y-4 hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                    <div className="flex items-center justify-between">
                       <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{ev.type}</span>
                       <span className="text-[9px] font-black text-muted-foreground uppercase">{ev.time}</span>
                    </div>
                    <p className="text-xs font-bold text-foreground leading-relaxed">{ev.msg}</p>
                    <div className="flex gap-2">
                       {ev.tags.map((t: string) => <Badge key={t} variant="secondary" className="px-2 py-0 text-[8px]">{t}</Badge>)}
                    </div>
                 </Card>
              )) : (
                <div className="col-span-3 py-12 text-center border-2 border-dashed border-border/20 rounded-3xl">
                   <p className="text-sm font-bold text-muted-foreground">Waiting for intelligence signals...</p>
                </div>
              )}
           </div>
        </motion.section>
      </div>
    </SidebarLayout>
  );
}
