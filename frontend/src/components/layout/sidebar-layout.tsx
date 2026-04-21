"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Target, Building2, Briefcase,
  Mail, Settings, HelpCircle, ChevronLeft, LogOut,
  Bell, Search, Menu, Brain, Zap, Sparkles, MessageSquare,
  ShieldCheck, Command, Bot, FileSearch, DollarSign, Rocket,
  LifeBuoy, Activity, Network, Cpu, Globe, HeartPulse
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

import { usersApi, agentsApi, UserOut } from "@/lib/api";
import { useWebSocket } from "@/providers/websocket-provider";
import { toast } from "sonner";

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [streamOpen, setStreamOpen] = useState(false);
  const [user, setUser] = useState<UserOut | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const { lastMessage, isConnected } = useWebSocket();
  const pathname = usePathname();
  const router = useRouter();

  const [executing, setExecuting] = useState(false);

  React.useEffect(() => {
    usersApi.me().then(setUser).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (lastMessage) {
      setEvents(prev => [lastMessage, ...prev].slice(0, 50));
    }
  }, [lastMessage]);

  const handleRunPipeline = async (isMock: boolean = false) => {
    try {
      setExecuting(true);
      await agentsApi.runSwarm({ 
        industry: "technology", 
        location: "United States", 
        send_emails: false,
        mock_mode: isMock
      });
      
      if (isMock) {
        toast.success("Demo Intelligence Syndicated", { 
          description: "Growth nodes are now being processed.",
          icon: <Sparkles className="w-4 h-4 text-primary" />
        });
        setStreamOpen(true);
      } else {
        toast.success("Autonomous Swarm Initialized");
      }
    } catch (err) {
      toast.error("Bridge Connection Failed.");
    } finally {
      setExecuting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("dvt_token");
    router.push("/auth/login");
  };

  const SECTIONS = [
    {
      label: "Intelligence",
      items: [
        { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Swarm Control", icon: Rocket, href: "/dashboard/swarm" },
      ]
    },
    {
      label: "Execution",
      items: [
        { label: "Pipeline", icon: Activity, href: "/dashboard/pipeline" },
        { label: "Analytics", icon: Zap, href: "/dashboard/analytics" },
      ]
    },
    {
      label: "Management",
      items: [
        { label: "Settings", icon: Settings, href: "/dashboard/settings" },
        { label: "Team", icon: Users, href: "/dashboard/team" },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-primary/20">
      {/* Sidebar: Naturalist Design */}
      <motion.aside 
        animate={{ width: collapsed ? 100 : 300 }}
        className="relative z-30 h-full bg-white border-r border-border/50 flex flex-col transition-all organic-shadow"
      >
        {/* Header/Logo */}
        <div className="p-8 flex items-center justify-between">
           <Link href="/dashboard" className="flex items-center gap-4 group overflow-hidden">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 flex-shrink-0 group-hover:rotate-6 transition-transform duration-500">
                 <Bot className="w-6 h-6 text-white" />
              </div>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col"
                  >
                    <span className="text-sm font-black text-foreground uppercase tracking-tight italic">DVT Talent</span>
                    <span className="text-[8px] font-black text-primary tracking-[0.25em] uppercase opacity-60">Intelligence Node</span>
                  </motion.div>
                )}
              </AnimatePresence>
           </Link>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-6 space-y-10">
           {SECTIONS.map((section) => (
              <div key={section.label} className="space-y-4">
                 {!collapsed && (
                    <h3 className="px-4 text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] italic">
                       {section.label}
                    </h3>
                 )}
                 <div className="space-y-2">
                    {section.items.map((item) => {
                       const isActive = pathname === item.href;
                       return (
                          <Link key={item.label} href={item.href}>
                             <div className={cn(
                                "group flex items-center gap-4 px-4 h-12 rounded-[1.25rem] transition-all duration-500 relative",
                                isActive 
                                 ? "bg-primary text-white shadow-xl shadow-primary/20" 
                                 : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                             )}>
                                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-primary/60 group-hover:text-primary")} />
                                <AnimatePresence>
                                  {!collapsed && (
                                    <motion.span 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="text-[10px] font-black uppercase tracking-widest italic"
                                    >
                                      {item.label}
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                                {isActive && !collapsed && (
                                   <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                                )}
                             </div>
                          </Link>
                       );
                    })}
                 </div>
              </div>
           ))}
        </div>

        {/* User / Logout */}
        <div className="p-6 border-t border-border/20 space-y-6">
           {user && !collapsed && (
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-primary/5 border border-primary/5">
                 <div className="w-10 h-10 rounded-full bg-white border border-border/50 flex items-center justify-center shadow-sm">
                    <span className="text-[11px] font-black text-primary">{user.email[0].toUpperCase()}</span>
                 </div>
                 <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-black text-foreground truncate uppercase italic">{user.email.split('@')[0]}</span>
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Operator: Active</span>
                 </div>
              </div>
           )}
           <div className="flex items-center justify-between px-2">
              <button 
                onClick={handleLogout} 
                className={cn(
                  "flex items-center gap-4 p-3 rounded-2xl text-muted-foreground hover:text-rose-500 hover:bg-rose-500/5 transition-all duration-500",
                  collapsed && "mx-auto"
                )}
              >
                 <LogOut className="w-6 h-6 stroke-[1.5px]" />
                 {!collapsed && <span className="text-[9px] font-black uppercase tracking-[0.2em] italic opacity-60">Terminate Bridge</span>}
              </button>
              {!collapsed && (
                 <button onClick={() => setCollapsed(true)} className="p-3 bg-primary/5 hover:bg-primary/10 rounded-2xl text-primary transition-all duration-500">
                    <ChevronLeft className="w-4 h-4" />
                 </button>
              )}
           </div>
        </div>
      </motion.aside>

      {/* Main Bridge Environment */}
      <div className="flex-1 flex flex-col relative min-w-0">
        {/* Universal Header */}
        <header className="h-24 bg-white/60 backdrop-blur-3xl border-b border-border/40 flex items-center justify-between px-10 z-20">
           <div className="flex items-center gap-8">
              {collapsed && (
                <button onClick={() => setCollapsed(false)} className="p-3 bg-primary/5 hover:bg-primary/10 rounded-2xl text-primary transition-transform active:scale-95 duration-500">
                  <Menu className="w-6 h-6" />
                </button>
              )}
              <div className="flex items-center gap-4">
                 <div className={cn(
                   "w-2.5 h-2.5 rounded-full shadow-[0_0_12px]",
                   isConnected ? "bg-emerald-500 shadow-emerald-500/50 animate-pulse" : "bg-rose-500 shadow-rose-500/50"
                 )} />
                 <div className="flex flex-col">
                    <span className={cn(
                       "text-[10px] font-black uppercase tracking-[0.25em] leading-none",
                       isConnected ? "text-emerald-700" : "text-rose-700"
                    )}>
                       {isConnected ? "Engine: Live" : "Bridge: Offline"}
                    </span>
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest opacity-30 mt-1.5 italic">Synchronized Node</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-6">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-12 px-6 bg-white border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest flex items-center gap-3 group rounded-2xl shadow-xl shadow-primary/5"
                onClick={() => handleRunPipeline(true)}
                disabled={executing}
              >
                  <Rocket className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-500" />
                  Synthesis 
              </Button>
              <div className="relative">
                 <Button 
                   variant="primary" 
                   size="sm" 
                   className="h-12 px-6 flex items-center gap-3 rounded-2xl shadow-xl shadow-primary/20"
                   onClick={() => setStreamOpen(!streamOpen)}
                 >
                     <Zap className="w-4 h-4 fill-current group-hover:animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Signals</span>
                 </Button>
                 {events.length > 0 && !streamOpen && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-bounce" />
                 )}
              </div>
              <div className="h-8 w-px bg-border/40 mx-2" />
              <ThemeToggle />
           </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-background/50 relative p-12 custom-scrollbar">
           <div className="max-w-7xl mx-auto h-full">
              {children}
           </div>
        </main>

        {/* Intelligence Drawer: Naturalist Stream */}
        <AnimatePresence>
          {streamOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setStreamOpen(false)}
                className="absolute inset-0 bg-primary/2 backdrop-blur-sm z-30"
              />
              <motion.aside
                initial={{ x: 500 }}
                animate={{ x: 0 }}
                exit={{ x: 500 }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 w-[450px] bg-white border-l border-border/50 z-40 shadow-2xl flex flex-col"
              >
                <div className="p-10 border-b border-border/20 flex items-center justify-between bg-white/50 backdrop-blur-md">
                   <div className="flex flex-col">
                     <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic leading-none">Intelligence Signal</h3>
                     <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase mt-2 opacity-60">Autonomous Stream</span>
                   </div>
                   <button onClick={() => setStreamOpen(false)} className="p-3 bg-primary/5 hover:bg-primary/10 rounded-2xl text-primary transition-all duration-500">
                     <ChevronLeft className="w-5 h-5 rotate-180" />
                   </button>
                </div>

                <div className="flex-1 overflow-auto p-10 space-y-8 no-scrollbar">
                   {events.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
                         <div className="w-24 h-24 rounded-[3rem] bg-primary/5 flex items-center justify-center animate-pulse">
                            <Brain className="w-10 h-10 text-primary/20" />
                         </div>
                         <div className="space-y-3">
                            <h4 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">No Active Signals</h4>
                            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-loose opacity-60 italic">
                               Awaiting autonomous reasoning epoch.<br/>Connecting to global nodes.
                            </p>
                         </div>
                         <Button 
                            variant="secondary" 
                            className="h-14 px-10 rounded-[1.5rem] bg-white border-primary/20 text-primary hover:bg-primary hover:text-white transition-all w-full font-black uppercase text-[10px] tracking-widest"
                            onClick={() => handleRunPipeline(true)}
                            disabled={executing}
                         >
                            <Sparkles className="w-4 h-4 mr-3" />
                            Launch Demo Synthesis
                         </Button>
                      </div>
                   ) : (
                      events.map((ev, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={i} 
                          className="p-8 rounded-[2rem] bg-primary/5 border border-transparent space-y-4 group hover:bg-white hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-700 cursor-default"
                        >
                           <div className="flex items-center justify-between">
                              <Badge variant="primary" className="bg-primary/10 text-primary border-transparent px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">{ev.agent || "Core Node"}</Badge>
                              <span className="text-[10px] font-black text-muted-foreground uppercase italic opacity-40">{new Date().toLocaleTimeString()}</span>
                           </div>
                           <p className="text-sm font-black text-foreground leading-relaxed italic opacity-80">
                              {ev.message || "Initializing intelligence signal node..."}
                           </p>
                           <div className="flex items-center gap-3 pt-2">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <div className="flex-1 h-px bg-gradient-to-r from-primary/20 to-transparent" />
                           </div>
                        </motion.div>
                      ))
                   )}
                </div>
                
                <div className="p-8 border-t border-border/20 bg-secondary/5">
                   <div className="flex items-center justify-between p-6 rounded-[1.5rem] bg-white border border-border/50">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center">
                            <HeartPulse className="w-5 h-5 text-primary" />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-foreground uppercase tracking-widest italic">Signal Healthy</span>
                            <span className="text-[8px] font-black text-muted-foreground uppercase mt-1">Latency: 12ms</span>
                         </div>
                      </div>
                      <Badge variant="primary" className="bg-emerald-500/5 text-emerald-600 border-transparent text-[8px]">Active</Badge>
                   </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
