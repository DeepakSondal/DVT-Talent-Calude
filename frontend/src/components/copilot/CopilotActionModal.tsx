"use client";

import React, { useState, useEffect } from "react";
import { X, Play, Edit3, Users, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { copilotApi } from "@/lib/api";
import { toast } from "sonner";

interface CopilotActionModalProps {
  task: any | null;
  onClose: () => void;
  onComplete: () => void;
}

export function CopilotActionModal({ task, onClose, onComplete }: CopilotActionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedJd, setEditedJd] = useState("");
  const [approvedCandidates, setApprovedCandidates] = useState<any[]>([]);

  useEffect(() => {
    if (task?.current_checkpoint === "discovery_complete") {
      setEditedJd(
        task.output_data?.discovery?.job_description || 
        "Edit the AI-generated Job Description here before launching the Sourcing swarm..."
      );
    }
    if (task?.current_checkpoint === "sourcing_complete") {
      setApprovedCandidates(task.output_data?.sourcing?.candidates || []);
    }
  }, [task]);

  if (!task) return null;

  const handleApproveDiscovery = async () => {
    try {
      setIsSubmitting(true);
      const tenant_id = localStorage.getItem("tenant_id") || "00000000-0000-0000-0000-000000000000";
      
      const promise = copilotApi.startSourcing({
        task_id: task.id,
        approved_jd: editedJd,
        location: "United States", // Would typically pull from task state
        tenant_id
      });

      toast.promise(promise, {
        loading: "Initializing Phase 2: Sourcing Pipeline...",
        success: "JD Approved! AI is now sourcing candidates.",
        error: "Failed to resume pipeline."
      });

      await promise;
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveSourcing = async () => {
    try {
      setIsSubmitting(true);
      const tenant_id = localStorage.getItem("tenant_id") || "00000000-0000-0000-0000-000000000000";
      
      const promise = copilotApi.startOutreach({
        task_id: task.id,
        approved_candidates: approvedCandidates,
        job_context: { title: "Custom Role", company_name: "DVT" }, // Simplified
        tenant_id
      });

      toast.promise(promise, {
        loading: "Initializing Phase 3: Screening & Outreach...",
        success: "Candidates Approved! AI is now drafting emails.",
        error: "Failed to resume pipeline."
      });

      await promise;
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCandidate = (cand: any) => {
    if (approvedCandidates.find((c) => c.id === cand.id)) {
      setApprovedCandidates(prev => prev.filter(c => c.id !== cand.id));
    } else {
      setApprovedCandidates(prev => [...prev, cand]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background w-full max-w-4xl rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between bg-primary/5">
          <div>
            <Badge variant="primary" className="mb-2 uppercase text-[9px] font-black tracking-widest">Action Required</Badge>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
              {task.current_checkpoint === "discovery_complete" ? "Approve Strategy" : "Approve Candidates"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* STATE 1: Modify JD */}
          {task.current_checkpoint === "discovery_complete" && (
            <div className="space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-4 text-emerald-700">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Market IQ scan complete. The AI drafted the optimal job description. Edit it manually below before the Swarm begins sourcing.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                  <Edit3 className="w-3 h-3" /> Job Requirements Prompts
                </label>
                <textarea
                  value={editedJd}
                  onChange={(e) => setEditedJd(e.target.value)}
                  className="w-full h-64 p-4 rounded-xl border border-border/50 bg-secondary/20 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STATE 2: Select Candidates */}
          {task.current_checkpoint === "sourcing_complete" && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-4 text-blue-700">
                <Users className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">Sourcing swarm complete. Found {task.output_data?.sourcing?.candidates?.length || 0} matches. Deselect any candidates you do not want the AI to email.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(task.output_data?.sourcing?.candidates || []).map((cand: any, i: number) => {
                  const isSelected = !!approvedCandidates.find(c => c.id === cand.id);
                  return (
                    <div 
                      key={cand.id || i} 
                      onClick={() => toggleCandidate(cand)}
                      className={cn(
                        "p-4 rounded-xl border cursor-pointer transition-all duration-200",
                        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 opacity-60 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm">{cand.first_name || cand.login}</h4>
                        <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", isSelected ? "border-primary bg-primary" : "border-muted-foreground")}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{cand.profile_url}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border/50 flex justify-end gap-4 bg-muted/20">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          
          {task.current_checkpoint === "discovery_complete" && (
            <Button variant="primary" onClick={handleApproveDiscovery} isLoading={isSubmitting} className="font-bold uppercase tracking-wide gap-2">
              <Play className="w-4 h-4" /> Approve JD & Start Sourcing
            </Button>
          )}

          {task.current_checkpoint === "sourcing_complete" && (
            <Button variant="primary" onClick={handleApproveSourcing} isLoading={isSubmitting} className="font-bold uppercase tracking-wide gap-2 text-white bg-indigo-600 hover:bg-indigo-700">
              <Mail className="w-4 h-4" /> Approve Candidates & Send Emails
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
