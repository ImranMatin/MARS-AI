import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, Search, ShieldAlert, PenTool, Rocket, Target, Sparkles,
  ArrowRight, CheckCircle2, Shield, Globe, Users, FileText,
  TrendingUp, Award, Clock
} from "lucide-react";

const ThemeToggleInline = () => {
  const toggleTheme = () => {
    const cur = localStorage.getItem('mars-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mars-theme', next);
    document.documentElement.classList.toggle('light-mode', next === 'light');
    document.documentElement.classList.toggle('dark-mode', next === 'dark');
    window.dispatchEvent(new Event('theme-changed'));
  };
  return (
    <Button variant="outline" size="sm" onClick={toggleTheme} data-testid="btn-theme-toggle-landing">
      Toggle Theme
    </Button>
  );
};

const LandingPage = () => {
  const { user } = useAuth();
  
  const missionPoints = [
    { icon: Rocket, title: "Autonomous Research", desc: "AI agents work in parallel to compress hours of research into minutes" },
    { icon: Shield, title: "Verified Sources", desc: "Every URL is HTTP-checked with credibility scores from 0-100" },
    { icon: Users, title: "Adversarial Fact-Checking", desc: "An aggressive critic must find flaws before the final report is written" },
  ];
  
  const features = [
    { icon: Search, color: '#0ea5e9', title: 'Lead Researcher', desc: 'Finds credible sources across the web' },
    { icon: ShieldAlert, color: '#f97316', title: 'Aggressive Fact-Checker', desc: 'Scrutinizes for bias, contradiction, and errors' },
    { icon: PenTool, color: '#10b981', title: 'Technical Writer', desc: 'Synthesizes a balanced 500-word report' },
    { icon: FileText, color: '#8b5cf6', title: '5 Export Formats', desc: 'PDF, Markdown, JSON, Word (.docx), LaTeX (.tex)' },
    { icon: Target, color: '#ec4899', title: 'Custom Agents', desc: 'Define expertise, personality, and goals per agent' },
    { icon: Clock, color: '#22c55e', title: 'Fast Mode', desc: '15-20 second research with GPT-4o Mini' },
  ];
  
  const stats = [
    { value: '3', label: 'AI Agents' },
    { value: '~15s', label: 'Research Time' },
    { value: '5', label: 'Export Formats' },
    { value: '100%', label: 'Verified Sources' },
  ];

  return (
    <div className="min-h-screen bg-background-1 text-foreground-1">
      {/* Navigation */}
      <nav className="border-b border-border-1 sticky top-0 z-40 backdrop-blur-lg bg-background-1/80">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              className="p-2 rounded-lg bg-primary/20"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Zap className="w-5 h-5 text-primary" />
            </motion.div>
            <span className="text-xl font-bold">MARS</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggleInline />
            {user ? (
              <Link to="/dashboard">
                <Button size="sm" data-testid="btn-go-dashboard">
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" data-testid="btn-nav-login">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" data-testid="btn-nav-register">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Powered by CrewAI + GPT-5.2</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Deep Research,<br/>
            <span className="text-primary">Autonomous.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-1 mb-10 leading-relaxed">
            MARS deploys three specialized AI agents that hunt sources, aggressively fact-check findings, 
            and synthesize balanced research reports — with verified URLs and credibility scores.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={user ? "/dashboard" : "/register"}>
              <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90" data-testid="btn-hero-start">
                {user ? "Open Dashboard" : "Start Researching Free"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="h-12 px-8" data-testid="btn-hero-signin">
                Sign In
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {stats.map((stat, idx) => (
            <motion.div 
              key={stat.label}
              className="text-center p-6 bg-surface-1 border border-border-1 rounded-lg"
              whileHover={{ y: -4 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-1 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Vision & Mission */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16" id="vision">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div 
            className="p-8 bg-surface-1 border border-border-1 rounded-2xl"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-8 h-8 text-researcher" />
              <h2 className="text-3xl font-bold">Vision</h2>
            </div>
            <p className="text-base text-muted-1 leading-relaxed">
              A world where every researcher, journalist, student, and analyst has access to a tireless team of 
              AI collaborators — one that <span className="text-foreground-1 font-medium">hunts sources</span>, 
              <span className="text-foreground-1 font-medium"> challenges assumptions</span>, and 
              <span className="text-foreground-1 font-medium"> synthesizes truth</span>. We believe that combining human curiosity with adversarial AI agents will unlock a new era of trustworthy research.
            </p>
          </motion.div>
          
          <motion.div 
            className="p-8 bg-surface-1 border border-border-1 rounded-2xl"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-writer" />
              <h2 className="text-3xl font-bold">Mission</h2>
            </div>
            <p className="text-base text-muted-1 leading-relaxed mb-4">
              To eliminate confirmation bias and hallucination from AI research by orchestrating a sequential team of specialized agents that hold each other accountable.
            </p>
            <ul className="space-y-2">
              {missionPoints.map((point) => (
                <li key={point.title} className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium">{point.title}:</span>{' '}
                    <span className="text-muted-1">{point.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">Everything you need to research faster</h2>
          <p className="text-lg text-muted-1">Six agents, five formats, one workflow</p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div 
                key={feat.title}
                className="p-6 bg-surface-1 border border-border-1 rounded-xl"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -6, boxShadow: `0 20px 40px -20px ${feat.color}40` }}
              >
                <div className="p-3 rounded-lg inline-block mb-4" style={{ backgroundColor: `${feat.color}20` }}>
                  <Icon className="w-6 h-6" style={{ color: feat.color }} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feat.title}</h3>
                <p className="text-muted-1">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 md:px-8 py-16">
        <motion.div 
          className="p-8 md:p-12 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 rounded-2xl text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <Award className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to research at AI speed?</h2>
          <p className="text-lg text-muted-1 mb-8">Join the team of researchers who let AI do the heavy lifting.</p>
          <Link to={user ? "/dashboard" : "/register"}>
            <Button size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90" data-testid="btn-cta-start">
              {user ? "Open Dashboard" : "Create Free Account"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-1 mt-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-1">MARS © 2026 — Multi-Agent Research System</span>
          </div>
          <div className="text-sm text-muted-1">
            Powered by CrewAI + GPT-5.2 Thinking
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
