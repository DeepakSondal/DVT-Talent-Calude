"use client";

import { useState } from "react";
import { 
  Target, Search, Filter, Plus, MoreHorizontal, 
  ArrowUpRight, Clock, Building2, User as UserIcon,
  ChevronRight, AlertCircle, CheckCircle2, Timer,
  TrendingUp, Zap, Sparkles, ShieldCheck, Loader2, DollarSign
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { leadsApi, type Lead } from "@/lib/api";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const STAGE_COLORS: Record<string, string> = {
  new: "text-primary bg-primary/10 border-primary/20",
  contacted: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  qualified: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  proposal: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
  negotiation: "text-fuchsia-500 bg-fuchsia-500/10 border-fuchsia-500/20",
  won: "text-emerald-600 bg-emerald-500/20 border-emerald-500/30",
  lost: "text-muted-foreground bg-secondary/20 border-border/50",
};

export default function LeadsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["leads", filter, search],
    queryFn: () => leadsApi.list({ 
       status: filter === "all" ? undefined : filter,
       search: search || undefined
    }),
    placeholderData: (previousData: any) => previousData,
  });

  const leads = data?.items || [];

  return (
    <SidebarLayout>
      <div className="space-y-12 pb-20">
        {/* Naturalist Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-3">
              <Badge variant="primary" className="py-1 px-4 text-[9px] font-black border-primary/20 bg-primary/5">
                 <Target className="w-3.5 h-3.5 mr-2 inline" />
                 Market Signal Detection: High
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground leading-none">
                 Market <span className="text-primary italic">Intelligence</span>
              </h1>
              <p className="text-muted-foreground font-bold text-lg max-w-xl">
                 Autonomous tracking of hiring signals, expansion events, and talent demand.
              </p>
           </div>
           <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2 h-12 px-6 bg-white">
                 <Clock className="w-4 h-4" />
                 Signal History
              </Button>
              <Button variant="primary" className="gap-2 h-12 px-8 shadow-primary/20">
                 <Plus className="w-5 h-5" />
                 Capture Intel
              </Button>
           </div>
        </div>

        {/* Filter & Search Environment */}
        <Card className="p-6 bg-white/80 backdrop-blur-xl border-border/50">
           <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 relative group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                 <input 
                   type="text"
                   placeholder="Search companies, signals, or demand patterns..."
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   className="w-full pl-12 pr-4 py-4 bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground placeholder:text-muted-foreground/40 placeholder:lowercase placeholder:tracking-normal transition-all"
                 />
              </div>
              
              <div className="md:col-span-5 flex items-center bg-secondary/20 rounded-2xl p-1.5 border border-border/20">
                 {["all", "new", "qualified", "won"].map((t) => (
                   <button
                     key={t}
                     onClick={() => setFilter(t)}
                     className={cn(
                       "flex-1 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300",
                       filter === t ? "bg-white text-primary shadow-lg" : "text-muted-foreground hover:text-foreground"
                     )}
                   >
                     {t}
                   </button>
                 ))}
              </div>
           </div>
        </Card>

        {/* Intelligence Grid / Table */}
        <Card className="overflow-hidden border-border/50 shadow-xl shadow-primary/5 bg-white/60">
           <div className="overflow-x-auto text-left">
              <table className="w-full border-collapse">
                 <thead>
                    <tr className="bg-secondary/10 border-b border-border/20">
                       <th className="p-7 text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Target Intel</th>
                       <th className="p-7 text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Pipeline Alignment</th>
                       <th className="p-7 text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Heat Score</th>
                       <th className="p-7 text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Yield Est.</th>
                       <th className="p-7 w-12 text-center text-[10px] font-black uppercase text-white/20 tracking-widest"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/20 relative">
                    {isLoading && (
                      <tr className="bg-white/80 backdrop-blur-sm">
                        <td colSpan={5} className="py-32 text-center">
                           <div className="flex flex-col items-center gap-4">
                              <Loader2 className="w-8 h-8 text-primary animate-spin" />
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Scanning market signal grid...</p>
                           </div>
                        </td>
                      </tr>
                    )}

                    <AnimatePresence mode="popLayout">
                      {!isLoading && leads.map((lead: Lead, i: number) => (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedLead(lead)}
                          className="group hover:bg-white transition-all cursor-pointer"
                        >
                           <td className="p-7">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 rounded-2xl bg-secondary/30 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                    <Building2 className="w-6 h-6 text-primary/60 group-hover:text-white transition-colors" />
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">
                                       {lead.company_name || `Intel Node #${lead.id.split("-")[0]}`}
                                    </p>
                                    <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                       <Sparkles className="w-3 h-3 text-primary" />
                                       Origin: {lead.source || "Autonomous Discovery"}
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="p-7">
                              <div className={cn(
                                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-inner",
                                STAGE_COLORS[lead.status] || STAGE_COLORS.lost
                              )}>
                                 {lead.status === "won" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                 {lead.status === "new" && <AlertCircle className="w-3.5 h-3.5" />}
                                 {lead.status === "negotiation" && <Timer className="w-3.5 h-3.5 border-none" />}
                                 {lead.status}
                              </div>
                           </td>
                           <td className="p-7">
                              <div className="flex items-center gap-4">
                                 <div className="text-sm font-black text-primary italic">
                                    {Math.round(lead.score)}%
                                 </div>
                                 <div className="w-20 h-1.5 bg-primary/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${lead.score}%` }}
                                      transition={{ duration: 1.5, delay: 0.5 }}
                                      className={cn(
                                        "h-full bg-primary",
                                        lead.score > 85 && "bg-emerald-500",
                                        lead.score < 40 && "opacity-40"
                                      )}
                                    />
                                 </div>
                              </div>
                           </td>
                           <td className="p-7">
                              <div className="text-sm font-black text-foreground italic flex items-center gap-1">
                                 <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                 {lead.value_estimate?.toLocaleString() || "0"}
                              </div>
                           </td>
                           <td className="p-7">
                              <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                 <Button variant="ghost" size="icon" className="w-9 h-9 hover:bg-primary/10 hover:text-primary"><TrendingUp className="w-4 h-4" /></Button>
                                 <Button variant="ghost" size="icon" className="w-9 h-9 hover:bg-primary/10"><ChevronRight className="w-4 h-4" /></Button>
                              </div>
                           </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                 </tbody>
              </table>
           </div>

           {!isLoading && leads.length === 0 && (
             <div className="py-40 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mx-auto">
                   <Target className="w-10 h-10 text-primary/20" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Zero Signals Detected</h3>
                   <p className="text-muted-foreground font-bold text-sm">Expanding discovery swarm to find more market intel.</p>
                </div>
                <Button variant="outline" onClick={() => { setFilter("all"); setSearch(""); }}>Reset Intel Filter</Button>
             </div>
           )}

            <div className="p-6 bg-secondary/5 border-t border-border/20 flex items-center justify-between">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Synthesizing current market velocity results
               </p>
               <div className="flex gap-10">
                  {["CSV Export", "Bulk Transition", "Purge Stale"].map(act => (
                     <button key={act} className="text-[10px] font-black text-primary/60 uppercase tracking-[0.2em] hover:text-primary transition-colors">
                        {act}
                     </button>
                  ))}
               </div>
            </div>
         </Card>

         {/* Lead Detail Modal */}
         <AnimatePresence>
            {selectedLead && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     onClick={() => setSelectedLead(null)}
                     className="absolute inset-0 bg-charcoal-700/80 backdrop-blur-md"
                  />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className="relative w-full max-w-2xl bg-white rounded-4xl overflow-hidden shadow-2xl z-10 font-mono"
                  >
                     <div className="p-10 space-y-8">
                        <div className="flex items-start justify-between">
                           <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                                 <Building2 className="w-8 h-8 text-primary" />
                              </div>
                              <div>
                                 <h2 className="text-2xl font-black tracking-tighter uppercase">{selectedLead.company_name}</h2>
                                 <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{selectedLead.domain}</p>
                              </div>
                           </div>
                           <Badge className={cn("h-8 px-4", STAGE_COLORS[selectedLead.status])}>{selectedLead.status}</Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="p-6 bg-secondary/10 rounded-3xl border border-border/20">
                              <p className="text-[10px] uppercase text-muted-foreground font-black mb-2">Market Heat Score</p>
                              <div className="text-3xl font-black text-primary italic">{Math.round(selectedLead.score)}%</div>
                           </div>
                           <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-900/10">
                              <p className="text-[10px] uppercase text-emerald-800 font-black mb-2">Est. Annual Yield</p>
                              <div className="text-3xl font-black text-emerald-600 italic">${selectedLead.value_estimate?.toLocaleString() || "0"}</div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="text-[10px] uppercase text-primary font-black tracking-[0.3em]">AI Intelligence Digest</h4>
                           <div className="text-xs leading-relaxed text-foreground font-bold border-l-4 border-primary/20 pl-6 py-2">
                              {selectedLead.notes || "Autonomous agents have detected high hiring activity in Generative AI and Platform Engineering. Company profile suggests rapid acceleration in Series B funding stage."}
                           </div>
                        </div>

                        <div className="pt-6 border-t border-border/20 flex gap-4">
                           <Button className="flex-1 h-12 rounded-2xl bg-black text-white hover:bg-zinc-800">Assign Recruiter</Button>
                           <Button variant="outline" className="flex-1 h-12 rounded-2xl">View Domain Analysis</Button>
                        </div>
                     </div>
                  </motion.div>
               </div>
            )}
         </AnimatePresence>
      </div>
    </SidebarLayout>
  );
}
