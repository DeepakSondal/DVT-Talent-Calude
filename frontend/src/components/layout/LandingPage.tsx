"use client";

import { motion } from "framer-motion";
import { 
  ArrowRight, Bot, Target, Zap, Mail, Shield, 
  Search, Users, Calendar, BarChart3, ChevronRight,
  FileText, Briefcase, Sparkles, CheckCircle2,
  Globe, ShieldCheck, HeartPulse
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  const stagger = {
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-sans selection:bg-primary/20">
      {/* Organic Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-primary/5 blur-[120px] rounded-full -z-10 opacity-60" />

      {/* Navigation */}
      <nav 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          isScrolled 
            ? "py-4 bg-background/80 backdrop-blur-2xl border-b border-border/50" 
            : "py-8 bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-foreground uppercase leading-none">
                DVT Talent
              </span>
              <span className="text-[9px] font-black tracking-[0.2em] text-primary uppercase mt-1">
                Natural Intelligence
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {["Platform", "Agents", "Success", "Pricing"].map((item) => (
              <Link 
                key={item} 
                href={`#${item.toLowerCase()}`} 
                className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
              >
                {item}
              </Link>
            ))}
            <div className="h-4 w-px bg-border mx-2" />
            <Link href="/auth/login" className="text-[11px] font-black uppercase tracking-[0.2em] hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register">
              <Button variant="primary" size="sm" className="h-10 px-6">Free Trial</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero: Humance-Centric AI */}
        <section className="relative pt-40 pb-24 lg:pt-64 lg:pb-48">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <motion.div 
                initial="initial"
                whileInView="whileInView"
                viewport={{ once: true }}
                variants={stagger}
                className="space-y-10 text-center lg:text-left"
              >
                <motion.div variants={fadeIn}>
                  <Badge variant="primary" className="py-1.5 px-5 text-[10px] font-black border-primary/10 bg-primary/5">
                    <Sparkles className="w-3.5 h-3.5 mr-2 inline text-primary" />
                    The Future of Organic Recruitment
                  </Badge>
                </motion.div>

                <motion.h1 variants={fadeIn} className="text-6xl lg:text-8xl font-black leading-[0.95] tracking-tighter text-foreground">
                  Grow Your <br />
                  <span className="text-primary italic">Intelligence</span> <br />
                  Automated.
                </motion.h1>

                <motion.p variants={fadeIn} className="text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed font-bold">
                  Scale your human potential with 10 autonomous AI agents. 
                  DVT Talent syncs discovery, outreach, and analysis into one 
                  calm, high-performance command bridge.
                </motion.p>

                <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start">
                  <Link href="/auth/register" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full h-16 px-12 group">
                      Initialize Trial
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="#preview" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full h-16 px-12">
                      Watch the Swarm
                    </Button>
                  </Link>
                </motion.div>

                <motion.div variants={fadeIn} className="pt-10 flex flex-wrap items-center justify-center lg:justify-start gap-8 opacity-40 grayscale group hover:grayscale-0 transition-all duration-700">
                   <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><Globe className="w-4 h-4" /> Global Reach</div>
                   <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><ShieldCheck className="w-4 h-4" /> ISO Certified</div>
                   <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"><HeartPulse className="w-4 h-4" /> Humane AI</div>
                </motion.div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative hidden lg:block"
              >
                <div className="relative z-10 rounded-[4rem] p-3 bg-white/20 backdrop-blur-2xl border border-white/30 shadow-[0_50px_100px_-20px_rgba(132,169,140,0.15)] overflow-hidden">
                  <div className="rounded-[3.2rem] overflow-hidden bg-background border border-border/50">
                    <Image 
                      src="/naturalist_ai_recruiting_dashboard_mockup_1775521383094.png" 
                      alt="DVT Talent Command Center v2"
                      width={1200}
                      height={800}
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-[2s]"
                    />
                  </div>
                </div>
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10" />
                <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full -z-10" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Matrix: Transparent Intelligence */}
        <section id="agents" className="py-32 lg:py-56 relative bg-secondary/5">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-3 gap-20 items-end mb-24">
               <div className="col-span-2 space-y-6">
                  <Badge variant="outline" className="text-[9px] font-black tracking-[0.3em] uppercase">Core Intelligence</Badge>
                  <h2 className="text-4xl lg:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
                    10 Agents. One <span className="text-primary italic">Flawless</span> Ecosystem.
                  </h2>
               </div>
               <p className="text-muted-foreground font-bold text-lg leading-relaxed">
                  We don't just automate tasks. We plant autonomous talent seeds that grow into your high-performing workforce.
               </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  icon: Target, 
                  title: "Discovery Swarm", 
                  desc: "Scanning 50+ professional networks to find candidates that don't just 'fit' but thrive.",
                  tags: ["Real-time", "Multi-modal"]
                },
                { 
                  icon: Mail, 
                  title: "Natural Outreach", 
                  desc: "Drafting messages that feel written by a mentor, not a bot. 4x higher quality replies garantueed.",
                  tags: ["Humane", "Adaptive"]
                },
                { 
                  icon: Users, 
                  title: "Integrity Lab", 
                  desc: "Deep skill verification and resume de-biasing. We see the talent, not the template.",
                  tags: ["De-biased", "Deep-scan"]
                },
                { 
                  icon: BarChart3, 
                  title: "Yield Velocity", 
                  desc: "Predictive analytics that tell you when your next hire will land before you even interview them.",
                  tags: ["Predictive", "ROI"]
                },
                { 
                  icon: Shield, 
                  title: "Sovereign Compliance", 
                  desc: "Global data protection baked into every agent signal. Zero-trust security, maximum trust relationships.",
                  tags: ["GDPR+", "Encrypted"]
                },
                { 
                  icon: Zap, 
                  title: "Pulse Bridge", 
                  desc: "A real-time WebSocket connection to your AI's reasoning. Total transparency in every decision.",
                  tags: ["WS", "Infinite"]
                }
              ].map((feat, i) => (
                <motion.div
                   key={i}
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-10 group bg-background/40 hover:bg-white transition-all duration-700 h-full border-primary/5 hover:border-primary/20">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-8 group-hover:bg-primary transition-colors duration-500">
                      <feat.icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-500" />
                    </div>
                    <h3 className="text-2xl font-black text-foreground mb-4 tracking-tight">{feat.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-bold mb-8">{feat.desc}</p>
                    <div className="flex gap-2">
                       {feat.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-primary/5 text-primary/60 border-transparent">{tag}</Badge>
                       ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Proof Section: Organic Trust */}
        <section className="py-32 lg:py-56 bg-background">
          <div className="max-w-5xl mx-auto px-6 text-center">
             <motion.div 
               {...fadeIn}
               className="space-y-12"
             >
                <h2 className="text-5xl lg:text-8xl font-black tracking-tighter text-foreground leading-none">
                  Trusted by the <br /> <span className="text-primary tracking-[-0.05em] px-4 py-2 border-2 border-primary/20 rounded-[2rem] inline-block mt-4 italic">Modern Vanguard</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center opacity-30 invert dark:invert-0 grayscale hover:grayscale-0 transition-all duration-1000">
                   <div className="text-xl font-black tracking-tighter uppercase italic">Helix Robotics</div>
                   <div className="text-xl font-black tracking-tighter uppercase">Vanguard VC</div>
                   <div className="text-xl font-black tracking-tighter uppercase italic">Bloom Labs</div>
                   <div className="text-xl font-black tracking-tighter uppercase">Terraform</div>
                </div>
             </motion.div>
          </div>
        </section>

        {/* Final Call: Planting the Seed */}
        <section className="py-48 relative overflow-hidden bg-primary/5">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-12 relative z-10">
            <motion.div {...fadeIn}>
               <h2 className="text-6xl lg:text-[10rem] font-black leading-[0.85] tracking-tighter text-foreground">
                  Ready to <br />
                  <span className="text-primary italic">Grow?</span>
               </h2>
            </motion.div>
            <motion.div
               initial={{ y: 20, opacity: 0 }}
               whileInView={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.3 }}
               className="flex flex-col sm:flex-row items-center justify-center gap-6"
            >
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-20 px-16 text-xl">
                  Start Initialization
                </Button>
              </Link>
              <Link href="#contact" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-20 px-12 bg-white">
                   Speak with Growth Lead
                </Button>
              </Link>
            </motion.div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">
               Secure Deployment • 14-Day Organic Growth Trial • No Commitments
            </p>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-primary/10 blur-[150px] -z-10 rounded-full" />
        </section>
      </main>

      {/* Natural Footer */}
      <footer className="py-32 border-t border-border/50 relative bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-20 mb-32">
            <div className="col-span-2 space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black tracking-tight text-foreground uppercase">DVT Talent</span>
              </div>
              <p className="text-muted-foreground max-w-sm leading-relaxed font-bold text-lg">
                The world's first organic AI command center for talent and growth leaders. 
                Built to scale intelligence, beautifully.
              </p>
              <div className="flex gap-10">
                 {["Twitter", "LinkedIn", "Substack"].map(social => (
                    <Link key={social} href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">{social}</Link>
                 ))}
              </div>
            </div>
            <div className="space-y-8">
              <h4 className="font-black uppercase text-[10px] tracking-[0.4em] text-primary">Ecosystem</h4>
              <ul className="space-y-4 text-sm font-bold">
                <li><Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">AI Agents</Link></li>
                <li><Link href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">Our Workflow</Link></li>
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Command Bridge</Link></li>
              </ul>
            </div>
            <div className="space-y-8">
              <h4 className="font-black uppercase text-[10px] tracking-[0.4em] text-primary">Guidelines</h4>
              <ul className="space-y-4 text-sm font-bold">
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Ethics</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Growth</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact Humans</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-20 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-10">
             <div className="flex items-center gap-3 opacity-30">
               <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               <p className="text-[9px] font-black uppercase tracking-widest text-foreground">All Agents Operational • v2.0.4-NATURALIST</p>
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">© 2026 DVT Talent AI. Autonomous Workforce Inc. All Organic Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
