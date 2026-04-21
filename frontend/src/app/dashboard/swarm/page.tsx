"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Activity, Users, Target, 
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Calendar, AlertCircle, Loader2, Mail,
  CheckCircle2, Clock, Settings2, RefreshCw,
  Play, Pause, ChevronRight, BarChart3,
  Download, Filter, Plus, Globe, ArrowRight,
  Share2, Building2, Sparkles, ShieldCheck, HeartPulse, Rocket, Search, Database, Bot
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { agentsApi, copilotApi, type Company } from "@/lib/api";
import { useState } from "react";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { CopilotActionModal } from "@/components/copilot/CopilotActionModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function SwarmControlPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [industry, setIndustry] = useState("Technology");
  const [location, setLocation] = useState("United States");
  const [sources, setSources] = useState<string[]>(["github", "dice", "web"]);
  const [pipelineMode, setPipelineMode] = useState<"autonomous" | "copilot">("autonomous");
  const [activeCopilotTask, setActiveCopilotTask] = useState<any | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["swarm-run-history"],
    queryFn: () => agentsApi.listTasks(10),
  });

  const tasks = data?.tasks || [];

  const handleRunSwarm = async () => {
    try {
      setIsRunning(true);
      
      let promise;
      if (pipelineMode === "autonomous") {
        promise = agentsApi.runSwarm({ 
          industry, 
          location, 
          send_emails: false 
        });
        toast.promise(promise, {
           loading: "Initializing unified 5-agent swarm...",
           success: "Swarm sequence complete. Pipeline synchronized.",
           error: "Bridge failure during swarm execution."
        });
      } else {
        // [NEW] Copilot Mode
        let tenant_id = localStorage.getItem("tenant_id") || "00000000-0000-0000-0000-000000000000"; // fallback
        promise = copilotApi.startDiscovery({ industry, location, tenant_id });
        toast.promise(promise, {
           loading: "Launching Copilot Phase 1: Discovery & Strategy...",
           success: "Phase 1 Complete. Awaiting manual JD approval...",
           error: "Failed to initialize Copilot workflow."
        });
      }

      await promise;
      
      setTimeout(() => {
        refetch();
        setIsRunning(false);
      }, 3000);

    } catch (err) {
      console.error("Swarm execution failed:", err);
      setIsRunning(false);
    }
  };

  const toggleSource = (source: string) => {
    setSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source) 
        : [...prev, source]
    );
  };

  return (
    <SidebarLayout>
      <div className="space-y-12 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-3">
              <Badge variant="primary" className="py-1 px-4 text-[9px] font-black border-primary/20 bg-primary/5">
                 <Rocket className="w-3.5 h-3.5 mr-2 inline" />
                 Swarm Orchestrator: Online
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground leading-none">
                 Swarm <span className="text-primary italic">Control</span>
              </h1>
              <p className="text-muted-foreground font-bold text-lg max-w-xl">
                 Unified command center to deploy Discovery, Sourcing, and Outreach agents in one click.
              </p>
           </div>
           <div className="flex gap-4">
              <Button 
                variant="primary" 
                className="gap-3 h-14 px-10 rounded-2xl shadow-primary/20" 
                onClick={handleRunSwarm} 
                isLoading={isRunning}
              >
                 <Zap className={cn("w-4 h-4 fill-current", !isRunning && "animate-pulse")} />
                 Run Full Swarm
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-12 gap-12">
           <div className="col-span-12 lg:col-span-4 space-y-8">
              <Card className="bg-white/80 border-border/50 p-8 shadow-xl shadow-primary/5">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground opacity-40 mb-8 flex items-center gap-3">
                    <Filter className="w-3.5 h-3.5" />
                    Swarm Parameters
                 </h3>
                 <div className="space-y-8">
                    <Input 
                      label="Industry Focus" 
                      value={industry} 
                      onChange={(e) => setIndustry(e.target.value)}
                      className="bg-primary/5 border-transparent h-14 font-black italic uppercase text-[11px] tracking-widest" 
                    />
                    <Input 
                      label="Geographic Range" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-primary/5 border-transparent h-14 font-black italic uppercase text-[11px] tracking-widest" 
                    />
                    
                    <div className="space-y-4">
                       <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1 italic">Intelligence Sources</label>
                       <div className="flex flex-wrap gap-2">
                          {["github", "dice", "monster", "web"].map(s => (
                             <Badge 
                               key={s} 
                               onClick={() => toggleSource(s)}
                               variant={sources.includes(s) ? "primary" : "secondary"} 
                               className="cursor-pointer hover:bg-primary hover:text-white transition-all duration-500 py-1.5 px-4 font-black text-[9px] uppercase tracking-widest border-transparent"
                             >
                                {s}
                             </Badge>
                          ))}
                       </div>
                    </div>

                    <div className="pt-6 space-y-4">
                       <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest italic opacity-60">
                          <span>Pipeline Mode</span>
                          <span className="text-primary tracking-[0.3em]">{pipelineMode === "autonomous" ? "Autopilot" : "Copilot (HITL)"}</span>
                       </div>
                       <div className="flex bg-primary/5 rounded-2xl p-1 gap-1">
                          <button 
                            onClick={() => setPipelineMode("autonomous")}
                            className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest italic rounded-xl transition-all duration-300", pipelineMode === "autonomous" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/50")}
                          >
                            Autopilot
                          </button>
                          <button 
                            onClick={() => setPipelineMode("copilot")}
                            className={cn("flex-1 py-3 text-[10px] font-black uppercase tracking-widest italic rounded-xl transition-all duration-300", pipelineMode === "copilot" ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/50")}
                          >
                            Copilot (Pause)
                          </button>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="bg-secondary/5 border-border/50 p-8 space-y-8 shadow-xl shadow-primary/5">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                       <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="text-sm font-black text-foreground uppercase tracking-tight italic">Swarm Protocol</h4>
                 </div>
                 <div className="space-y-4 pt-2">
                    {[
                      { text: "Discovery: Market & Leads", icon: Search },
                      { text: "Sourcing: Talent & Scoring", icon: Database },
                      { text: "Outreach: Multi-channel", icon: Mail },
                      { text: "Analytics: Sythesis", icon: BarChart3 }
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3 group">
                         <div className="w-6 h-6 rounded-lg bg-white border border-border/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <s.icon className="w-3 h-3" />
                          </div>
                          <span className="text-[9px] font-black uppercase text-muted-foreground italic tracking-widest group-hover:text-primary transition-colors">{s.text}</span>
                      </div>
                    ))}
                 </div>
              </Card>
           </div>

           <div className="col-span-12 lg:col-span-8 space-y-8">
              <Card className="min-h-[600px] flex flex-col p-0 overflow-hidden bg-white shadow-2xl shadow-primary/5 border-border/50">
                 <div className="p-8 border-b border-border/20 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10 text-foreground">
                    <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                       <Activity className="w-5 h-5 text-primary" />
                       Recent Swarm Activity
                    </h3>
                 </div>

                 <div className="flex-1 overflow-y-auto divide-y divide-border/20 relative">
                    {isLoading ? (
                       <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-4">
                          <Loader2 className="w-10 h-10 text-primary animate-spin" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Syncing Pipeline</span>
                       </div>
                    ) : tasks.length > 0 ? (
                      tasks.map((task: any, i: number) => (
                        <div key={task.id} className="p-8 flex items-center justify-between hover:bg-primary/[0.02] transition-all duration-500 group">
                           <div className="flex items-center gap-6">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                                task.status === "completed" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                              )}>
                                 <Bot className="w-6 h-6" />
                              </div>
                              <div className="space-y-1">
                                 <h4 className="text-lg font-black text-foreground uppercase tracking-tight italic">{task.agent_name || task.task_type}</h4>
                                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{new Date(task.created_at).toLocaleString()}</span>
                                 {task.pipeline_mode === "copilot" && task.status === "awaiting_input" && (
                                    <Badge 
                                      variant="secondary" 
                                      className="ml-2 text-[8px] cursor-pointer hover:bg-emerald-500 hover:text-white transition-all bg-emerald-50 text-emerald-700 border-emerald-200"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCopilotTask(task);
                                      }}
                                    >
                                      Action Required: Review Checkpoint
                                    </Badge>
                                 )}
                              </div>
                           </div>
                           <Badge variant={task.status === "completed" ? "success" : "primary"}>
                              {task.status}
                           </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-32 text-center space-y-8">
                         <div className="w-24 h-24 rounded-[3rem] bg-primary/5 flex items-center justify-center mx-auto">
                            <Target className="w-10 h-10 text-primary/20" />
                         </div>
                         <h3 className="text-2xl font-black text-foreground uppercase tracking-tight italic">No Swarm History</h3>
                         <Button variant="outline" onClick={handleRunSwarm}>Initiate First Swarm</Button>
                      </div>
                    )}
                 </div>
              </Card>
           </div>
         </div>
      </div>
      
      {/* Copilot Interactive Modal */}
      {activeCopilotTask && (
        <CopilotActionModal 
          task={activeCopilotTask} 
          onClose={() => setActiveCopilotTask(null)} 
          onComplete={() => {
            setActiveCopilotTask(null);
            refetch();
          }} 
        />
      )}
    </SidebarLayout>
  );
}
