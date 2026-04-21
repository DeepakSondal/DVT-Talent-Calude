"use client";

import React, { useEffect, useState } from "react";
import { tenantsApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Settings, Users, Shield, Building, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
    const [tenant, setTenant] = useState<any>(null);
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [t, m] = await Promise.all([tenantsApi.getMe(), tenantsApi.getTeam()]);
                setTenant(t);
                setTeam(m);
            } catch (err) {
                toast.error("Failed to load settings");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await tenantsApi.updateMe(tenant);
            toast.success("Identity Updated", { description: "Branding changes are now live across all microsites." });
        } catch (err) {
            toast.error("Update Failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-emerald-500 font-mono animate-pulse">Synchronizing Enterprise Config...</div>;

    return (
        <div className="p-8 space-y-8 bg-black min-h-screen text-emerald-500 font-mono">
            <header className="flex items-center gap-4 border-b border-emerald-900 pb-6">
                <Settings className="w-8 h-8 text-emerald-400" />
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Enterprise Sovereignty</h1>
                    <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-[0.4em]">Organization Config & Governance</p>
                </div>
            </header>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-emerald-950/20 border border-emerald-900 mb-8 p-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black font-black uppercase text-[10px] py-2 px-6">
                        <Building className="w-3 h-3 mr-2" /> Identity & Branding
                    </TabsTrigger>
                    <TabsTrigger value="team" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-black font-black uppercase text-[10px] py-2 px-6">
                        <Users className="w-3 h-3 mr-2" /> Team Roster
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <Card className="bg-black border-emerald-900">
                        <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-emerald-400">Organization Profile</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-emerald-800 font-black">Tenant Alias</label>
                                <Input 
                                    value={tenant?.name || ""} 
                                    onChange={e => setTenant({...tenant, name: e.target.value})}
                                    className="bg-black border-emerald-900 text-emerald-400 focus-visible:ring-emerald-500" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase text-emerald-800 font-black">Logo Vector URL</label>
                                <Input 
                                    value={tenant?.logo_url || ""} 
                                    onChange={e => setTenant({...tenant, logo_url: e.target.value})}
                                    className="bg-black border-emerald-900 text-emerald-400 focus-visible:ring-emerald-500" 
                                />
                            </div>
                            <Button 
                                onClick={handleUpdate} 
                                disabled={saving}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs px-8"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Commit Profile Updates</>}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="team">
                    <Card className="bg-black border-emerald-900">
                        <CardHeader><CardTitle className="text-xs uppercase tracking-widest text-emerald-400">Authorized Agents & Recruiters</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {team.map((u: any) => (
                                    <div key={u.id} className="flex items-center justify-between border-b border-emerald-900/40 pb-4">
                                        <div>
                                            <p className="text-sm font-bold">{u.full_name}</p>
                                            <p className="text-[10px] text-emerald-800">{u.email}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-[9px] uppercase border border-emerald-900 px-2 py-1 rounded text-emerald-700">{u.role}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
