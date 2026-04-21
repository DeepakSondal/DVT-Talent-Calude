"use client";

import { useState } from "react";
import { 
  Users, UserPlus, Search, Filter, 
  MoreVertical, Shield, ShieldCheck, ShieldAlert,
  Mail, Clock, Trash2, Loader2, AlertCircle,
  TrendingUp, UserCheck, CheckCircle2,
  Lock, Fingerprint, Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usersApi, type UserOut, type UserRole } from "@/lib/api";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function TeamPage() {
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => usersApi.me(),
  });

  const { data: teamData, isLoading, refetch, error } = useQuery({
    queryKey: ["team-members"],
    queryFn: () => usersApi.list(),
  });

  const members = teamData?.items || [];

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await usersApi.updateRole(userId, newRole);
      toast.success(`Operator role updated to ${newRole}`);
      refetch();
    } catch (err) {
      toast.error("Failed to update operator role.");
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (userId === me?.id) {
       toast.error("You cannot decommission your own operator node.");
       return;
    }
    try {
      await usersApi.deactivate(userId);
      toast.success("Operator access suspended.");
      refetch();
    } catch (err) {
      toast.error("Failed to deactivate operator.");
    }
  };

  if (error) {
     return (
        <SidebarLayout>
           <div className="h-[60vh] flex flex-col items-center justify-center space-y-8">
              <div className="w-20 h-20 rounded-[2.5rem] bg-rose-500/5 flex items-center justify-center border border-rose-500/20 shadow-xl shadow-rose-500/5">
                 <ShieldAlert className="w-8 h-8 text-rose-600" />
              </div>
              <div className="text-center space-y-3">
                 <h2 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">Access Restricted</h2>
                 <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-60 max-w-xs mx-auto italic">Admin authorization required to manage workspace operator nodes.</p>
              </div>
              <Button variant="outline" className="h-12 px-8 uppercase text-[10px] font-black tracking-widest border-border/50" onClick={() => window.location.href='/dashboard'}>Return to HQ</Button>
           </div>
        </SidebarLayout>
     );
  }

  return (
    <SidebarLayout>
      <div className="space-y-12 pb-20">
        {/* Naturalist Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-3">
              <Badge variant="primary" className="py-1 px-4 text-[9px] font-black border-primary/20 bg-primary/5">
                 <ShieldCheck className="w-3.5 h-3.5 mr-2 inline" />
                 Workspace Governance: Verified
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground leading-none">
                 Operator <span className="text-primary italic">Directory</span>
              </h1>
              <p className="text-muted-foreground font-bold text-lg max-w-xl">
                 Manage workspace operators, access permissions, and autonomous bridge authority.
              </p>
           </div>
           <Button variant="primary" size="lg" className="h-14 px-10 rounded-2xl shadow-primary/20 gap-3 group">
              <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
              Invite Operator
           </Button>
        </div>

        {/* Workspace IQ Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           {[
             { label: "Active Nodes", value: members.length.toString(), icon: Users, color: "text-primary" },
             { label: "Active Admins", value: members.filter((m: UserOut) => m.role === 'admin').length.toString(), icon: Lock, color: "text-amber-600" },
             { label: "Synthesis Uptime", value: "99.9%", icon: TrendingUp, color: "text-emerald-600" },
             { label: "Infrastructure", value: "Verified", icon: Fingerprint, color: "text-primary" },
           ].map((stat, i) => (
             <Card key={i} className="p-8 space-y-6 bg-white/40 border-border/20 group hover:shadow-xl hover:shadow-primary/5 transition-all duration-700">
                <div className="flex items-center justify-between">
                   <div className="w-12 h-12 rounded-2xl bg-white border border-border/50 flex items-center justify-center group-hover:scale-110 transition-all duration-700">
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                   </div>
                   <div className="text-[10px] font-black text-muted-foreground/20 uppercase tracking-[0.3em] italic leading-none">0{i + 1}</div>
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">{stat.label}</p>
                   <div className="text-3xl font-black text-foreground mt-1 italic tracking-tighter">{stat.value}</div>
                </div>
             </Card>
           ))}
        </div>

        {/* Operator Registry */}
        <Card className="p-0 border-border/50 bg-white shadow-2xl shadow-primary/5 overflow-hidden rounded-[2.5rem]">
           <div className="p-8 border-b border-border/20 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/50 backdrop-blur-sm">
              <div className="relative flex-1 w-full md:max-w-md group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Search operator registry..." 
                   className="w-full bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 rounded-2xl py-4 pl-12 pr-4 text-[11px] font-black uppercase tracking-widest text-foreground placeholder:text-muted-foreground/40 placeholder:lowercase placeholder:tracking-normal transition-all"
                 />
              </div>
              <div className="flex gap-4">
                 <Button variant="outline" className="gap-3 rounded-2xl h-14 px-8 bg-white border-border/40 text-[10px] font-black uppercase tracking-widest">
                    <Filter className="w-4 h-4 text-primary/40" />
                    Role Protocol
                 </Button>
              </div>
           </div>

           <div className="overflow-x-auto relative min-h-[400px]">
              {isLoading && (
                 <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex flex-col items-center justify-center z-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Syncing Registry...</span>
                 </div>
              )}
              
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-primary/[0.02] border-b border-border/20">
                       <th className="p-8 text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em] italic">Operator Node</th>
                       <th className="p-8 text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em] italic">Bridge Authority</th>
                       <th className="p-8 text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em] italic">Authentication</th>
                       <th className="p-8 text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em] italic">Last Epoch</th>
                       <th className="p-8 text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em] italic">Initialization</th>
                       <th className="p-8 text-right text-[9px] font-black uppercase text-muted-foreground tracking-[0.25em] italic">Protocols</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-border/20">
                    <AnimatePresence mode="popLayout">
                       {members.map((member: UserOut, i: number) => (
                          <motion.tr 
                            key={member.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group hover:bg-primary/[0.01] transition-all duration-300"
                          >
                             <td className="p-8">
                                <div className="flex items-center gap-5">
                                   <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-foreground/5 flex items-center justify-center text-[11px] font-black text-primary shadow-sm group-hover:scale-105 transition-transform">
                                      {member.full_name?.split(' ').map((n: string) => n[0]).join('') || "?"}
                                   </div>
                                   <div className="space-y-1">
                                      <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors italic leading-none">{member.full_name}</div>
                                      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{member.email}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="p-8">
                                <div className="flex items-center gap-3">
                                   <Badge variant={member.role === 'admin' ? 'primary' : member.role === 'recruiter' ? 'secondary' : 'outline'} className="h-7 px-4">
                                      {member.role === 'admin' ? 'Bridge Controller' : member.role === 'recruiter' ? 'Signal Analyst' : 'Operator'}
                                   </Badge>
                                   {member.id === me?.id && (
                                      <Badge variant="outline" className="text-[8px] h-5 px-1.5 border-primary/20 text-primary bg-primary/5">YOU</Badge>
                                   )}
                                </div>
                             </td>
                             <td className="p-8">
                                <div className="flex items-center gap-3">
                                   <div className={cn("w-2 h-2 rounded-full", member.is_active ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-muted-foreground/20")} />
                                   <span className={cn("text-[10px] font-black uppercase tracking-widest italic", member.is_active ? "text-emerald-600" : "text-muted-foreground opacity-40")}>
                                      {member.is_active ? "Authorized" : "Suspended"}
                                   </span>
                                </div>
                             </td>
                             <td className="p-8 text-[10px] font-black text-muted-foreground/60 uppercase tabular-nums tracking-[0.1em] italic">
                                {member.last_login ? new Date(member.last_login).toLocaleDateString() : "OFFLINE"}
                             </td>
                             <td className="p-8 text-[10px] font-black text-muted-foreground/60 uppercase tabular-nums tracking-[0.1em] italic">
                                {new Date(member.created_at).toLocaleDateString()}
                             </td>
                             <td className="p-8">
                                <div className="flex items-center justify-end gap-3">
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="w-10 h-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors shadow-none"
                                      onClick={() => handleUpdateRole(member.id, member.role === 'admin' ? 'recruiter' : 'admin')}
                                      disabled={member.id === me?.id}
                                   >
                                      <Lock className="w-4 h-4" />
                                   </Button>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="w-10 h-10 rounded-xl hover:bg-rose-500/10 hover:text-rose-600 transition-colors shadow-none"
                                      onClick={() => handleDeactivate(member.id)}
                                      disabled={member.id === me?.id || !member.is_active}
                                   >
                                      <Zap className="w-4 h-4" />
                                   </Button>
                                   <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl">
                                      <MoreVertical className="w-4 h-4 opacity-40" />
                                   </Button>
                                </div>
                             </td>
                          </motion.tr>
                       ))}
                    </AnimatePresence>
                 </tbody>
              </table>
           </div>
        </Card>

        {/* Governance Footer */}
        <div className="flex flex-col md:flex-row items-center gap-8 justify-center pt-12 border-t border-border/20 opacity-40 italic">
           <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">SOC2 Protocol: Managed</span>
           </div>
           <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Encryption: AES-256 Symmetric</span>
           </div>
           <div className="flex items-center gap-3">
              <Fingerprint className="w-4 h-4 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Infrastructure: Audited</span>
           </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
