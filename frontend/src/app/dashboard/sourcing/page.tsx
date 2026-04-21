"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Zap, Target, Globe, Filter, Loader2 } from "lucide-react";
import { agentsApi } from "@/lib/api";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/Dialog";
import { Checkbox } from "@/components/ui/Checkbox";

const SECTORS = ["Generative AI", "Fintech", "Cybersecurity", "HealthTech", "Clean Energy"];

export default function SourcingPage() {
    const [loading, setLoading] = useState(false);
    const [selectedSectors, setSelectedSectors] = useState<string[]>(SECTORS);

    const handleInitiateSwarm = async () => {
        setLoading(true);
        try {
            const res = await agentsApi.triggerDag("Technology", "San Francisco", selectedSectors);
            toast.success("Swarm Initiated", {
                description: `Discovery cycle started for ${selectedSectors.length} sectors. Track progress in The Nexus.`
            });
        } catch (err) {
            toast.error("Swarm Failed", { description: "Check server logs." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 bg-black min-h-screen text-emerald-500 font-mono">
            <header className="flex items-center justify-between border-b border-emerald-900 pb-6">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Strategic Sourcing</h1>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-[0.4em]">Omnichannel Discovery Hub</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs px-6 py-6 h-auto">
                            <Zap className="w-4 h-4 mr-2" /> Initiate Swarm Discovery
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black border-emerald-900 text-emerald-500 font-mono">
                        <DialogHeader>
                            <DialogTitle className="text-emerald-400 uppercase font-black">Configure Swarm Parameters</DialogTitle>
                        </DialogHeader>
                        <div className="py-6 space-y-4">
                            <h4 className="text-[10px] uppercase text-emerald-800 font-bold">Priority Sectors</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {SECTORS.map(s => (
                                    <div key={s} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={s} 
                                            checked={selectedSectors.includes(s)}
                                            onCheckedChange={(checked: boolean) => {
                                                setSelectedSectors(prev => 
                                                    checked ? [...prev, s] : prev.filter(x => x !== s)
                                                )
                                            }}
                                            className="border-emerald-800 data-[state=checked]:bg-emerald-500"
                                        />
                                        <label htmlFor={s} className="text-xs">{s}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                onClick={handleInitiateSwarm}
                                disabled={loading || selectedSectors.length === 0}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Autonomous Agents"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-emerald-950/10 border-emerald-900 col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xs uppercase tracking-widest flex items-center gap-2">
                             <Globe className="w-4 h-4 text-emerald-800" /> Active Global Signals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[400px] flex items-center justify-center text-emerald-900 italic text-sm">
                        [ Omnichannel Heatmap Under Swarm Control ]
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card className="bg-black border-emerald-900">
                        <CardHeader>
                            <CardTitle className="text-xs uppercase tracking-widest">Target Profiles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {["VP Engineering", "CTO", "Head of AI"].map(role => (
                                <div key={role} className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                                    <span className="text-xs">{role}</span>
                                    <Badge className="bg-emerald-900/30 text-emerald-500 text-[9px] uppercase">Priority</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
