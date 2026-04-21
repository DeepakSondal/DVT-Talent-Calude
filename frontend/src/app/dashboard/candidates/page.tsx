"use client";

import { useState } from "react";
import { 
  Users, Search, Briefcase, 
  ChevronRight, Zap, Loader2, Plus, Filter,
  ArrowRight, Download, Share2, Star, 
  MapPin, DollarSign, UserCheck, Mail,
  ExternalLink, MoreVertical, Trash2,
  CheckCircle2, Square, CheckSquare,
  Sparkles, HeartPulse, ShieldCheck, Globe, Target
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { candidatesApi, type Candidate } from "@/lib/api";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";

export default function CandidatesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<Candidate | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["candidates", debouncedSearch],
    queryFn: () => candidatesApi.list({ search: debouncedSearch || undefined }),
    placeholderData: (previousData: any) => previousData,
  });

  const candidates = data?.items || [];

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === candidates.length && candidates.length > 0 ? [] : candidates.map((c: Candidate) => c.id));
  };

  return (
    <SidebarLayout>
      <div className="space-y-12 pb-20">
        {/* Naturalist Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-3">
              <Badge variant="primary" className="py-1 px-4 text-[9px] font-black border-primary/20 bg-primary/5">
                 <ShieldCheck className="w-3 h-3 mr-2 inline" />
                 Talent Integrity Verified
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground leading-none">
                 Talent <span className="text-primary italic">Synthesis</span>
              </h1>
              <p className="text-muted-foreground font-bold text-lg max-w-xl">
                 De-biased, high-precision talent discovery powered by autonomous agents.
              </p>
           </div>
           <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2 h-12 px-6 bg-white shadow-sm">
                 <Download className="w-4 h-4" />
                 Export Nodes
              </Button>
              <Button variant="primary" className="gap-2 h-12 px-8 shadow-primary/20">
                 <Plus className="w-5 h-5" />
                 Add Node
              </Button>
           </div>
        </div>

        {/* Filter & Command Bar */}
        <Card className="p-6 bg-white/80 backdrop-blur-xl border-border/50">
           <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                 <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                    <input 
                      type="text" 
                      placeholder="Search talent profiles, skills, or roles..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 rounded-2xl py-3.5 pl-12 pr-4 text-[11px] font-black uppercase tracking-widest text-foreground placeholder:text-muted-foreground/40 placeholder:lowercase placeholder:tracking-normal transition-all"
                    />
                 </div>
                 <Button variant="secondary" size="icon" className="shrink-0 w-12 h-12 rounded-2xl bg-primary/5 hover:bg-primary/10">
                    <Filter className="w-4 h-4 text-primary" />
                 </Button>
              </div>
              
              <AnimatePresence>
                {selectedIds.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-6"
                  >
                     <span className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedIds.length} Nodes Selected</span>
                     <div className="h-6 w-px bg-border/50" />
                     <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="h-9 px-4 text-rose-500 hover:bg-rose-500/5">
                           <Trash2 className="w-4 h-4 mr-2" />
                           Purge
                        </Button>
                        <Button variant="secondary" size="sm" className="h-9 px-4">
                           <Mail className="w-4 h-4 mr-2" />
                           Signal
                        </Button>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </Card>

        {/* Talent Grid / Table */}
        <Card className="overflow-hidden border-border/50 shadow-xl shadow-primary/5 bg-white/60">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-secondary/10 border-b border-border/20">
                       <th className="p-6 w-12">
                          <button onClick={toggleSelectAll} className="text-primary/40 hover:text-primary transition-colors">
                             {selectedIds.length === candidates.length && candidates.length > 0 ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5" />}
                          </button>
                       </th>
                       <th className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Synthesis Profile</th>
                       <th className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Current Alignment</th>
                       <th className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">State</th>
                       <th className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Heat Score</th>
                       <th className="p-6 text-[10px] font-black uppercase text-muted-foreground/60 tracking-[0.2em]">Discovery Date</th>
                       <th className="p-6 w-12 text-center text-[10px] font-black uppercase text-white/20 tracking-widest"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/20 relative">
                    {isLoading && (
                      <tr className="bg-white/80 backdrop-blur-sm">
                        <td colSpan={7} className="py-32 text-center">
                           <div className="flex flex-col items-center gap-4">
                              <Loader2 className="w-8 h-8 text-primary animate-spin" />
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Synthesizing talent nodes...</p>
                           </div>
                        </td>
                      </tr>
                    )}

                    <AnimatePresence mode="popLayout">
                      {!isLoading && candidates.map((can: Candidate, i: number) => (
                        <motion.tr 
                          key={can.id} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedNode(can)}
                          className={cn(
                            "group hover:bg-white transition-colors cursor-pointer",
                            selectedIds.includes(can.id) && "bg-primary/5"
                          )}
                        >
                           <td className="p-6">
                              <button onClick={() => toggleSelect(can.id)} className={cn("transition-colors", selectedIds.includes(can.id) ? "text-primary" : "text-primary/10 group-hover:text-primary/30")}>
                                 {selectedIds.includes(can.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                              </button>
                           </td>
                           <td className="p-6">
                              <div className="flex items-center gap-5">
                                 <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                    {can.first_name[0]}{can.last_name[0]}
                                 </div>
                                 <div className="space-y-1">
                                    <div className="text-sm font-black text-foreground">{can.first_name} {can.last_name}</div>
                                    <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                                       <Globe className="w-3 h-3" />
                                       {can.location || "Global Node"}
                                    </div>
                                 </div>
                              </div>
                           </td>
                           <td className="p-6">
                              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                 <Briefcase className="w-3.5 h-3.5 text-primary/40" />
                                 {can.title || "Undisclosed Alignment"}
                              </div>
                           </td>
                           <td className="p-6">
                              <Badge variant={can.status === "Interviewing" ? "primary" : can.status === "Placed" ? "success" : "secondary"} className="h-7 px-4">
                                 {can.status}
                              </Badge>
                           </td>
                           <td className="p-6">
                              <div className="flex items-center gap-4">
                                 <div className="text-sm font-black text-primary italic">
                                    {Math.round(can.score)}%
                                 </div>
                                 <div className="w-20 h-1.5 bg-primary/5 rounded-full overflow-hidden">
                                    <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${can.score}%` }}
                                       transition={{ duration: 1.5, ease: "easeOut" }}
                                       className="h-full bg-primary" 
                                    />
                                 </div>
                              </div>
                           </td>
                           <td className="p-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                              {new Date(can.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                           </td>
                           <td className="p-6">
                              <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                 <Button variant="ghost" size="icon" className="w-9 h-9 hover:bg-primary/10 hover:text-primary"><Mail className="w-4 h-4" /></Button>
                                 <Button variant="ghost" size="icon" className="w-9 h-9 hover:bg-rose-500/10 hover:text-rose-500"><Trash2 className="w-4 h-4" /></Button>
                                 <Button variant="ghost" size="icon" className="w-9 h-9 hover:bg-primary/10"><ExternalLink className="w-4 h-4" /></Button>
                              </div>
                           </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                 </tbody>
              </table>
           </div>
           
           {!isLoading && candidates.length === 0 && (
             <div className="py-40 text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mx-auto">
                   <Target className="w-10 h-10 text-primary/20" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Zero Matches Detected</h3>
                   <p className="text-muted-foreground font-bold text-sm">Expand your search patterns to discover more talent nodes.</p>
                </div>
                <Button variant="outline" onClick={() => setSearch("")}>Reset Search Grid</Button>
             </div>
           )}

            <div className="p-6 bg-secondary/5 border-t border-border/20 flex items-center justify-between">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Synthesized {candidates.length} talent nodes from global networks
               </p>
               <div className="flex gap-4">
                  <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:underline">Page Alpha</button>
                  <button className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Next Layer</button>
               </div>
            </div>
         </Card>

         {/* Talent Detail Modal */}
         <AnimatePresence>
            {selectedNode && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                     initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                     onClick={() => setSelectedNode(null)}
                     className="absolute inset-0 bg-charcoal-700/80 backdrop-blur-md"
                  />
                  <motion.div 
                     initial={{ opacity: 0, scale: 0.9, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.9, y: 20 }}
                     className="relative w-full max-w-4xl bg-white rounded-4xl overflow-hidden shadow-2xl z-10 font-mono"
                  >
                     <div className="flex flex-col md:flex-row h-[85vh]">
                        {/* Profile Sidebar */}
                        <div className="w-full md:w-80 bg-primary/5 p-8 border-r border-border/20 space-y-8 overflow-y-auto">
                           <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center text-3xl font-black text-white shadow-xl mx-auto md:mx-0">
                              {selectedNode.first_name[0]}{selectedNode.last_name[0]}
                           </div>
                           <div className="space-y-2 text-center md:text-left">
                              <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">{selectedNode.first_name} {selectedNode.last_name}</h2>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                                 <Briefcase className="w-3 h-3 text-primary" /> {selectedNode.title}
                              </p>
                           </div>
                           <div className="space-y-4 pt-4">
                              <div className="p-4 bg-white rounded-2xl border border-primary/10">
                                 <p className="text-[10px] uppercase text-muted-foreground font-black mb-1">Synthesized Score</p>
                                 <div className="flex items-end gap-2 text-3xl font-black text-primary italic">
                                    {Math.round(selectedNode.score)}%
                                    <Sparkles className="w-5 h-5 mb-1 animate-pulse" />
                                 </div>
                              </div>
                              <Button className="w-full h-12 rounded-2xl bg-black text-white hover:bg-zinc-800">
                                 <Mail className="w-4 h-4 mr-2" /> Signal Node
                              </Button>
                           </div>
                        </div>

                        {/* Main Stream Area */}
                        <div className="flex-1 p-10 overflow-y-auto space-y-10">
                           <section className="space-y-4">
                              <h4 className="text-[10px] uppercase text-primary font-black tracking-[0.3em]">Genetic Core Analysis</h4>
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                 {(selectedNode.skills || ["Node Synthesis", "Reactive Control", "AI Governance"]).map((s: string) => (
                                    <Badge key={s} className="bg-secondary/10 border-border/30 text-foreground py-2 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                       {s}
                                    </Badge>
                                 ))}
                              </div>
                           </section>

                           <section className="space-y-4">
                              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                                 <h4 className="text-[10px] uppercase text-primary font-black tracking-[0.3em]">Integrity Scorer Output</h4>
                                 <Badge variant="success" className="text-[9px] font-black">VALIDATED</Badge>
                              </div>
                              <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-900/10 text-xs leading-relaxed text-emerald-900 font-bold italic">
                                 "The agent swarm has verified this candidate's alignment with high-precision nodes. Domain-specific expertise in {selectedNode.title} is confirmed above segment baseline."
                              </div>
                           </section>
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
