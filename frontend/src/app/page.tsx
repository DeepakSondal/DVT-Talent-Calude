"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { 
  Zap, Shield, Globe, Users, 
  Target, Sparkles, ArrowRight,
  CheckCircle2, Play, ChevronRight,
  ShieldCheck, Bot, BarChart3
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-naturalist-cream font-mono selection:bg-naturalist-sage/30 text-naturalist-charcoal">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-naturalist-sage/10 bg-naturalist-cream/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-naturalist-sage flex items-center justify-center text-naturalist-cream font-black">D</div>
            <span className="font-black text-xl tracking-tighter uppercase">DVT <span className="text-naturalist-sage italic">Talent AI</span></span>
          </div>
          <div className="flex md:hidden items-center gap-3">
             <Link href="/auth/login">
               <Button variant="outline" className="h-9 px-4 rounded-xl border-naturalist-sage/20 font-black text-[9px] uppercase">Login</Button>
             </Link>
             <button className="w-10 h-10 rounded-xl bg-naturalist-sage/5 flex items-center justify-center text-naturalist-sage">
                <Users className="w-5 h-5" />
             </button>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {[
              { label: "Engine", href: "#engine" },
              { label: "Manifesto", href: "#manifesto" },
              { label: "Pricing", href: "#pricing" }
            ].map(item => (
              <a key={item.label} href={item.href} className="text-[10px] font-black uppercase tracking-widest hover:text-naturalist-sage transition-colors">{item.label}</a>
            ))}
            <Link href="/auth/login">
              <Button variant="outline" className="h-10 px-6 rounded-2xl border-naturalist-sage/20 font-black text-[10px] uppercase">Nexus Login</Button>
            </Link>
            <Button className="h-10 px-6 rounded-2xl bg-naturalist-sage hover:bg-naturalist-sage/90 text-naturalist-cream font-black text-[10px] uppercase">Request Swarm</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <motion.div 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
               className="space-y-4"
            >
              <Badge className="bg-naturalist-sage/5 border-naturalist-sage/20 text-naturalist-sage py-1.5 px-6 font-black text-[10px] uppercase tracking-[0.3em]">
                Version 1.0 Autonomous Swarm
              </Badge>
              <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-none italic">
                Recruiting <br />
                <span className="text-naturalist-sage">Autonomous</span>
              </h1>
              <p className="text-lg font-bold text-naturalist-charcoal/60 max-w-lg leading-relaxed">
                A self-governing intelligence swarm that discovers, screens, and engages global talent while you sleep. High-precision sourcing with ethical integrity.
              </p>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="h-16 px-10 rounded-3xl bg-naturalist-charcoal text-naturalist-cream hover:bg-naturalist-charcoal/90 font-black text-xs uppercase tracking-widest shadow-2xl">
                Start Discovery Trial <ArrowRight className="w-4 h-4 ml-3" />
              </Button>
              <Button variant="outline" className="h-16 px-10 rounded-3xl border-naturalist-sage/20 bg-white shadow-sm font-black text-xs uppercase tracking-widest gap-3">
                <Play className="w-4 h-4 fill-naturalist-sage text-naturalist-sage" /> Watch Engine Demo
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-naturalist-sage/20 blur-[120px] rounded-full" />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
               className="relative card bg-black/5 backdrop-blur-3xl border border-white/40 p-10 rounded-4xl shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-naturalist-moss animate-pulse" />
                <span className="text-[10px] font-black uppercase text-naturalist-charcoal opacity-40">Live Swarm Telemetry</span>
              </div>
              <div className="space-y-4">
                 {[
                   { t: "MarketIntelligence", s: "Scanning Fintech Sector", val: "ACTIVE" },
                   { t: "IntegrityScorer", s: "Validating Node #7492", val: "SUCCESS" },
                   { t: "VoiceSynth", s: "Generating Organic Sequence", val: "ROUTING" }
                 ].map((signal, i) => (
                   <div key={i} className="flex items-center justify-between bg-white/50 p-4 rounded-2xl border border-white/20">
                      <div>
                        <p className="text-[10px] font-black uppercase text-naturalist-sage">{signal.t}</p>
                        <p className="text-[9px] font-bold opacity-60 uppercase">{signal.s}</p>
                      </div>
                      <Badge variant="outline" className="border-naturalist-sage/20 text-[8px] font-black">{signal.val}</Badge>
                   </div>
                 ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section id="manifesto" className="py-40 px-8 border-y border-naturalist-sage/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-naturalist-sage/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="max-w-4xl mx-auto space-y-12 relative">
          <Badge className="bg-naturalist-sage/10 text-naturalist-sage font-black text-[9px] uppercase tracking-[0.4em] px-3 py-1">The Sovereign Manifesto</Badge>
          <h2 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none italic text-naturalist-charcoal">
            Recruiting is not a task. <br />
            It is <span className="text-naturalist-sage">Intelligence.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
            <p className="text-sm font-bold leading-relaxed text-naturalist-charcoal/60 text-balance">
              In the age of hyper-growth, human capacity is the ultimate bottleneck. Standard tools are passive; they wait for input. DVT Talent AI is active. It operates as a sovereign swarm—a collective of specialized sub-agents that don't just "process" data, but synthesize meaning from the noise of global job boards, repositories, and social signals.
            </p>
            <p className="text-sm font-bold leading-relaxed text-naturalist-charcoal/60 text-balance">
              We believe in the dignity of the candidate and the sovereignty of the firm. Our swarm is built with ethical guardrails to eliminate bias, ensure transparency, and restore the human connection by automating the machinery of discovery, leaving you with the art of the decision.
            </p>
          </div>
          <div className="pt-10 flex items-center gap-6">
            <div className="h-[2px] w-20 bg-naturalist-sage" />
            <span className="text-[10px] font-black uppercase tracking-widest text-naturalist-charcoal opacity-40">System Release 1.0.4 // Autonomous Era</span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="engine" className="py-32 px-8 bg-naturalist-charcoal text-naturalist-cream">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic">Engine Capabilities</h2>
            <div className="h-1 w-20 bg-naturalist-sage mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Autonomous Sourcing", icon: Globe, desc: "Infinite discovery across specialized tech networks and market signals." },
              { title: "Integrity Scoring", icon: ShieldCheck, desc: "Deep synthesis AI that validates candidate authenticity and expertise." },
              { title: "Voice Outreach", icon: Bot, desc: "High-fidelity synthetic voice interaction for first-touch screening." },
              { title: "Real-time Nexus", icon: BarChart3, desc: "A live window into every thought and action of your recruiter swarm." },
              { title: "Multi-tenancy", icon: Users, desc: "Complete data isolation for enterprise agencies and global firms." },
              { title: "Ethical Guards", icon: Shield, desc: "Automated bias detection ensuring inclusive language synthesis." },
            ].map((f, i) => (
              <Card key={i} className="bg-white/5 border-white/10 p-8 rounded-4xl hover:border-naturalist-sage/40 transition-all group">
                <CardContent className="p-0 space-y-6 text-naturalist-cream">
                  <f.icon className="w-10 h-10 text-naturalist-sage group-hover:scale-110 transition-transform" />
                  <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-tight">{f.title}</h3>
                    <p className="text-xs text-naturalist-cream/60 font-bold leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-8">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic text-naturalist-charcoal">Sovereign Scaling</h2>
            <p className="text-naturalist-charcoal/40 font-bold text-xs uppercase tracking-widest">Select your intelligence tier</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-10 rounded-4xl border border-naturalist-sage/20 bg-white space-y-8 flex flex-col">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Professional</h3>
                <p className="text-[10px] text-naturalist-charcoal/40 font-black uppercase mt-1">For growing teams</p>
              </div>
              <div className="text-5xl font-black italic text-naturalist-sage">$59 <span className="text-sm not-italic opacity-40">/mo</span></div>
              <ul className="space-y-4 flex-1">
                {["5,000 Nodes /mo", "Standard Swarm Access", "Email Synthesis", "Real-time Monitoring"].map(item => (
                   <li key={item} className="flex items-center gap-3 text-xs font-bold text-naturalist-charcoal/80">
                     <CheckCircle2 className="w-4 h-4 text-naturalist-sage" /> {item}
                   </li>
                ))}
              </ul>
              <Button className="w-full h-14 rounded-2xl bg-naturalist-sage text-naturalist-cream font-black uppercase text-[11px]">Deploy Bundle</Button>
            </div>

            <div className="p-10 rounded-4xl bg-naturalist-charcoal text-naturalist-cream space-y-8 flex flex-col shadow-2xl">
              <div>
                <Badge className="bg-naturalist-sage text-naturalist-cream mb-2 font-black">MOST ADOPTED</Badge>
                <h3 className="text-2xl font-black uppercase tracking-tight">Enterprise</h3>
              </div>
              <div className="text-5xl font-black italic text-white">Custom</div>
              <ul className="space-y-4 flex-1">
                {["Unlimited Swarm Dispatches", "Whitelabel Control Plane", "Dedicated Node Synthesis", "24/7 Priority Signals"].map(item => (
                   <li key={item} className="flex items-center gap-3 text-xs font-bold opacity-80">
                     <CheckCircle2 className="w-4 h-4 text-naturalist-sage" /> {item}
                   </li>
                ))}
              </ul>
              <Button className="w-full h-14 rounded-2xl bg-white text-naturalist-charcoal font-black uppercase text-[11px]">Contact Protocol</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-naturalist-sage/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <span className="font-black text-xl tracking-tighter uppercase">DVT <span className="text-naturalist-sage italic">Talent AI</span></span>
            <p className="text-[10px] font-bold text-naturalist-charcoal/40 uppercase tracking-widest max-w-[200px]">The Future of Autonomous Recruitment Sovereignty.</p>
          </div>
          <div className="flex gap-12">
            {[
              { h: "System", links: ["Engine", "Docs", "Changelog"] },
              { h: "Legal", links: ["Privacy", "Compliance", "Terms"] }
            ].map(col => (
               <div key={col.h} className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-naturalist-sage tracking-widest">{col.h}</h4>
                  <ul className="space-y-2">
                    {col.links.map(l => (
                      <li key={l}><button className="text-[10px] font-bold uppercase text-naturalist-charcoal/60 hover:text-naturalist-sage transition-colors">{l}</button></li>
                    ))}
                  </ul>
               </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
