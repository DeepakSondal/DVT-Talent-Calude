"use client";

import { useState } from "react";
import { 
  Mail, Search, Send, Inbox, 
  Trash2, Archive, Star, 
  MoreVertical, Paperclip, 
  Smile, Image as ImageIcon,
  CheckCheck, Eye, Reply,
  Zap, Sparkles, Pencil,
  Rocket, ShieldCheck, HeartPulse,
  ArrowRight, Bot, Clock, ChevronRight, Loader2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { campaignsApi, type EmailCampaign, type EmailSent } from "@/lib/api";
import { SidebarLayout } from "@/components/layout/sidebar-layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function OutreachPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  
  const biasWarning = ["rockstar", "ninja", "guru", "competitive"].some(w => 
    replyText.toLowerCase().includes(w)
  );

  // Campaigns Query
  const { data: campaignData, isLoading: campaignsLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignsApi.list(),
  });

  const campaigns = campaignData?.items || [];
  const activeCampaign = campaigns.find((c: EmailCampaign) => c.id === selectedCampaignId) || campaigns[0];

  // Emails Query
  const { data: emailData, isLoading: emailsLoading } = useQuery({
    queryKey: ["emails", activeCampaign?.id],
    queryFn: () => campaignsApi.listEmails(activeCampaign!.id),
    enabled: !!activeCampaign?.id,
  });

  const emails = emailData?.items || [];
  const activeEmail = emails.find((e: EmailSent) => e.id === selectedEmailId) || emails[0];

  return (
    <SidebarLayout>
      <div className="h-[calc(100vh-140px)] flex flex-col gap-10 pb-10">
        {/* Naturalist Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-3">
              <Badge variant="primary" className="py-1 px-4 text-[9px] font-black border-primary/20 bg-primary/5">
                 <HeartPulse className="w-3.5 h-3.5 mr-2 inline" />
                 Natural Language Synthesis Active
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-foreground leading-none">
                 Natural <span className="text-primary italic">Outreach</span>
              </h1>
              <p className="text-muted-foreground font-bold text-lg max-w-xl">
                 Crafting human-centric conversations that scale with autonomous integrity.
              </p>
           </div>
           <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2 h-12 px-6 bg-white">
                 <Archive className="w-4 h-4" />
                 Vault Archive
              </Button>
              <Button variant="primary" className="gap-2 h-12 px-8 shadow-primary/20">
                 <Send className="w-5 h-5" />
                 Initialize Sequence
              </Button>
           </div>
        </div>

        <div className="flex-1 flex gap-8 min-h-0">
           {/* Left: Signal Discovery List */}
           <Card className="w-96 flex flex-col p-0 overflow-hidden bg-white/60">
              <div className="p-6 border-b border-border/20 space-y-4">
                 <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Search signals..." 
                      className="w-full bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-foreground placeholder:text-muted-foreground/40 placeholder:lowercase placeholder:tracking-normal transition-all"
                    />
                 </div>
                 <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {["All", "Replied", "Unread", "Starred"].map((t: string) => (
                       <Badge key={t} variant={t === "All" ? "primary" : "secondary"} className="cursor-pointer h-7 px-4">
                          {t}
                       </Badge>
                    ))}
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/10">
                 {emailsLoading ? (
                    <div className="p-10 text-center">
                       <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-3" />
                       <p className="text-[9px] font-black text-muted-foreground uppercase">Syncing communication nodes...</p>
                    </div>
                 ) : emails.map((email: EmailSent, i: number) => (
                    <motion.div 
                      key={email.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedEmailId(email.id)}
                      className={cn(
                        "p-6 cursor-pointer transition-all group relative",
                        activeEmail?.id === email.id ? "bg-white shadow-xl shadow-primary/5 z-10" : "hover:bg-primary/5"
                      )}
                    >
                       <div className="flex items-center gap-4 mb-3">
                          <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all group-hover:scale-105",
                            activeEmail?.id === email.id ? "bg-primary text-white" : "bg-primary/10 text-primary"
                          )}>
                             {email.to_email[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-foreground truncate uppercase">{email.to_email.split('@')[0]}</span>
                                <span className="text-[9px] font-black text-muted-foreground uppercase">{email.sent_at ? "Today" : "Signal"}</span>
                             </div>
                             <p className="text-[10px] font-black text-primary truncate mt-1 tracking-tighter">{email.subject}</p>
                          </div>
                       </div>
                       <p className="text-[11px] font-bold text-muted-foreground line-clamp-2 leading-relaxed italic opacity-60">
                          {email.status === "sent" ? "Autonomous sequence delivered successfully." : "Awaiting agent synthesis..."}
                       </p>
                       {activeEmail?.id === email.id && (
                          <motion.div layoutId="activeEmail" className="absolute left-0 w-1 h-12 bg-primary rounded-full top-1/2 -translate-y-1/2" />
                       )}
                    </motion.div>
                 ))}
              </div>
           </Card>

           {/* Right: Synthesis Detail */}
           <Card className="flex-1 flex flex-col p-0 overflow-hidden bg-white/60 relative">
              {activeEmail ? (
                 <>
                    <div className="p-8 border-b border-border/20 flex items-center justify-between bg-white/40">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-sm font-black text-white shadow-lg shadow-primary/20">
                             {activeEmail.to_email[0].toUpperCase()}
                          </div>
                          <div className="space-y-1">
                             <h3 className="text-xl font-black text-foreground tracking-tight">{activeEmail.to_email}</h3>
                             <div className="flex items-center gap-3">
                                <Badge variant="outline" className="h-6 px-3 text-[8px] border-primary/20 bg-primary/5 text-primary">Identity Verified</Badge>
                                <div className="text-[10px] font-black text-muted-foreground flex items-center gap-2">
                                   <Eye className="w-3.5 h-3.5" />
                                   Delivered {activeEmail.sent_at || "Just Now"}
                                </div>
                             </div>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          {[Star, Archive, Trash2, MoreVertical].map((Icon: any, i: number) => (
                             <Button key={i} variant="ghost" size="icon" className="w-10 h-10 hover:bg-primary/5 text-muted-foreground hover:text-primary">
                                <Icon className="w-4 h-4" />
                             </Button>
                          ))}
                       </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12 space-y-12">
                       <div className="max-w-3xl mx-auto space-y-10">
                          <div className="space-y-6">
                             <h2 className="text-3xl font-black text-foreground leading-[1.1] tracking-tighter italic">
                                {activeEmail.subject}
                             </h2>
                             <Card className="p-10 bg-white/40 border-primary/5 shadow-sm space-y-6">
                                <div className="flex items-center gap-3 border-b border-border/20 pb-6 mb-6">
                                   <Bot className="w-5 h-5 text-primary" />
                                   <span className="text-[10px] font-black uppercase text-primary tracking-widest">Autonomous Delivery Synthesis</span>
                                </div>
                                <div className="space-y-4 text-sm font-bold text-muted-foreground leading-relaxed">
                                   <p>We've synthesized a personalized growth signal for <strong>{activeEmail.to_email}</strong>.</p>
                                   <p>The sequence is currently in the <strong>{activeEmail.status}</strong> state, monitored by our internal integrity engine.</p>
                                   <div className="p-6 rounded-2xl bg-secondary/10 border border-border/50 text-[11px] font-black uppercase tracking-widest leading-loose">
                                      &gt; Signal Metadata: Sequence Alpha // Node Velocity 0.84 // Response Pattern: Natural
                                   </div>
                                </div>
                             </Card>
                          </div>
                       </div>
                    </div>

                    {/* Composition / Action Area */}
                    <div className="p-8 border-t border-border/20 bg-white/40">
                       <div className="max-w-3xl mx-auto space-y-6">
                           <AnimatePresence>
                              {biasWarning && (
                                 <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase text-rose-800 tracking-widest"
                                 >
                                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                                    <span>Integrity Alert: Potential Bias Detected in language synthesis.</span>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                          <div className="relative group">
                             <textarea 
                                placeholder="Synth a natural response or use AI for organic drafting..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full bg-primary/5 border-transparent focus:bg-white focus:border-primary/20 rounded-[2rem] p-8 min-h-[140px] text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none font-bold text-lg placeholder:text-muted-foreground/20"
                             />
                             <div className="absolute right-6 bottom-6 flex items-center gap-4">
                                <div className="flex gap-2 text-muted-foreground/30">
                                   {[Paperclip, ImageIcon, Smile].map((Icon: any, i: number) => (
                                      <Icon key={i} className="w-5 h-5 hover:text-primary transition-colors cursor-pointer" />
                                   ))}
                                </div>
                                <Button 
                                  variant="primary" 
                                  onClick={() => toast.success("Sequence Updated", { description: "Synthetic response merged into the delivery pipeline." })}
                                  className="gap-3 px-10 h-14 rounded-2xl shadow-xl shadow-primary/20"
                                >
                                   <Sparkles className="w-4 h-4" />
                                   Synthetic Reply
                                </Button>
                             </div>
                          </div>
                       </div>
                    </div>
                 </>
              ) : (
                 <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-8">
                    <div className="w-24 h-24 rounded-[3rem] bg-primary/5 flex items-center justify-center">
                       <Mail className="w-10 h-10 text-primary/20" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Select a Signal</h3>
                       <p className="text-muted-foreground font-bold text-sm max-w-sm">Scan the communication grid to review active sequences and synthetic responses.</p>
                    </div>
                 </div>
              )}
           </Card>
        </div>
      </div>
    </SidebarLayout>
  );
}
