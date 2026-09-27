import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, Search, ShieldAlert, PenTool, Play, Loader2,
  AlertTriangle, CheckCircle2, Clock, Zap, History, Download,
  FileText, FileJson, FileDown, Trash2, RefreshCw, XCircle,
  TrendingUp, Cpu, FlaskConical, Scale, BarChart3, Target,
  Sparkles, Rocket, Award, Shield, Info, Sun, Moon, Settings,
  UserCog, ExternalLink, FileCode, FileSpreadsheet, CheckCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============ THEME CONTEXT ============
const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mars-theme') || 'dark';
  });
  
  useEffect(() => {
    localStorage.setItem('mars-theme', theme);
    document.documentElement.classList.toggle('light-mode', theme === 'light');
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
  }, [theme]);
  
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

const useTheme = () => useContext(ThemeContext);

// Icon mapping for templates
const TEMPLATE_ICONS = {
  'trending-up': TrendingUp, 'cpu': Cpu, 'flask': FlaskConical,
  'scale': Scale, 'chart': BarChart3, 'target': Target
};

// ============ THEME TOGGLE BUTTON ============
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <motion.button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-surface-1 border border-border-1 hover:border-primary transition-colors"
      whileHover={{ scale: 1.05, rotate: 15 }}
      whileTap={{ scale: 0.95 }}
      data-testid="theme-toggle"
      aria-label="Toggle theme"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0, rotate: -180 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 180 }}
          transition={{ duration: 0.25 }}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

// ============ CREDIBILITY BADGE ============
const CredibilityBadge = ({ score, level, size = 'sm', verified }) => {
  const getColor = () => {
    if (score >= 80) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' };
    if (score >= 60) return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' };
    if (score >= 40) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' };
    return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' };
  };
  
  const colors = getColor();
  const label = level ? level.replace('-', ' ') : 'unknown';
  
  return (
    <Badge 
      variant="outline" 
      className={`${colors.bg} ${colors.text} ${colors.border} ${size === 'lg' ? 'text-sm px-3 py-1' : ''} flex items-center gap-1`}
      data-testid="credibility-badge"
    >
      <Shield className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'}`} />
      {score}/100 {label !== 'unknown' && `- ${label}`}
      {verified === true && <CheckCircle className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} ml-1 text-emerald-400`} />}
      {verified === false && <AlertCircle className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} ml-1 text-red-400`} />}
    </Badge>
  );
};

// ============ TERMINAL FEED ============
const TerminalFeed = ({ logs, agentColor, isActive }) => {
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="bg-terminal-bg border border-border-1 rounded-md p-4 font-mono text-sm h-[280px] overflow-y-auto terminal-scroll relative"
      data-testid="terminal-feed"
    >
      <div className="space-y-1">
        {logs.length === 0 && (
          <div className="text-muted-1 italic text-sm">Waiting for agent to start...</div>
        )}
        {logs.map((log, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="flex gap-2"
          >
            <span className="text-muted-2 select-none">[{log.time}]</span>
            <span style={{ color: log.type === 'error' ? '#ef4444' : agentColor }}>
              {log.message}
            </span>
          </motion.div>
        ))}
        {isActive && (
          <div className="flex items-center gap-1">
            <span className="text-muted-2">&gt;</span>
            <span className="terminal-cursor" style={{ background: agentColor }}></span>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ AGENT CARD ============
const AgentCard = ({ title, icon: Icon, color, status, logs, description, testId }) => {
  const isActive = status === 'active';
  const isComplete = status === 'complete';
  const isIdle = status === 'idle';
  const glowClass = isActive ? 
    (color === '#0ea5e9' ? 'glow-researcher' : color === '#f97316' ? 'glow-fact-checker' : 'glow-writer') : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface-1 border border-border-1 p-6 rounded-lg relative overflow-hidden transition-opacity duration-300 ${isIdle ? 'opacity-60' : 'opacity-100'} ${glowClass}`}
      data-testid={testId}
      whileHover={{ y: -4 }}
    >
      {isActive && (
        <motion.div className="absolute inset-0 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="absolute inset-x-0 top-0 h-[2px] tracing-beam" style={{ '--beam-color': color }} />
        </motion.div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div 
            className="p-2 rounded-lg" 
            style={{ backgroundColor: `${color}20` }}
            animate={isActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </motion.div>
          <div>
            <h3 className="text-xl font-semibold text-foreground-1">{title}</h3>
            <p className="text-sm text-muted-1">{description}</p>
          </div>
        </div>
        <Badge 
          variant={isActive ? 'default' : isComplete ? 'secondary' : 'outline'}
          className={`${isActive ? 'bg-emerald-500 text-white animate-pulse-glow' : ''} ${isComplete ? 'bg-surface-2 text-foreground-1' : ''}`}
        >
          {isActive && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
          {isComplete && <CheckCircle2 className="w-3 h-3 mr-1" />}
          {isIdle && <Clock className="w-3 h-3 mr-1" />}
          {status === 'active' ? 'Processing' : status === 'complete' ? 'Complete' : 'Idle'}
        </Badge>
      </div>

      <TerminalFeed logs={logs} agentColor={color} isActive={isActive} />
    </motion.div>
  );
};

// ============ PROCESS FLOW ============
const ProcessFlow = ({ currentStep, progress }) => {
  const steps = [
    { name: 'Researcher', color: '#0ea5e9', icon: Search },
    { name: 'Fact-Checker', color: '#f97316', icon: ShieldAlert },
    { name: 'Writer', color: '#10b981', icon: PenTool }
  ];

  const getStepStatus = (index) => {
    if (currentStep > index) return 'complete';
    if (currentStep === index) return 'active';
    return 'idle';
  };

  return (
    <div className="my-8 space-y-4" data-testid="process-flow">
      {progress > 0 && progress < 100 && (
        <motion.div 
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-1">Research Progress</span>
            <span className="text-sm font-medium text-foreground-1">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>
      )}
      
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;
          return (
            <div key={step.name} className="flex items-center">
              <motion.div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${status === 'complete' ? 'border-border-2 bg-surface-2' : ''} ${status === 'active' ? 'border-2' : ''} ${status === 'idle' ? 'border-border-1 bg-surface-1/50 opacity-50' : ''}`}
                style={{ 
                  borderColor: status === 'active' ? step.color : undefined,
                  boxShadow: status === 'active' ? `0 0 15px -3px ${step.color}` : undefined
                }}
                animate={status === 'active' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Icon className="w-4 h-4" style={{ color: status !== 'idle' ? step.color : 'var(--muted-1)' }} />
                <span className="text-sm font-medium" style={{ color: status !== 'idle' ? 'var(--foreground-1)' : 'var(--muted-1)' }}>
                  {step.name}
                </span>
                {status === 'complete' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </motion.div>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 mx-2">
                  <motion.div 
                    className="h-full rounded"
                    initial={{ width: 0 }}
                    animate={{ width: currentStep > index ? '100%' : '0%' }}
                    style={{ backgroundColor: currentStep > index ? step.color : 'var(--border-1)' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============ EXPORT MENU ============
const ExportMenu = ({ sessionId, disabled }) => {
  const handleExport = async (format) => {
    try {
      const response = await fetch(`${API}/research/${sessionId}/export/${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extMap = { markdown: 'md', pdf: 'pdf', json: 'json', latex: 'tex', docx: 'docx' };
      a.download = `research-report-${sessionId.slice(0, 8)}.${extMap[format] || format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} data-testid="export-button">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Read-Only Formats</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('pdf')} data-testid="export-pdf">
          <FileDown className="w-4 h-4 mr-2" /> PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('markdown')}>
          <FileText className="w-4 h-4 mr-2" /> Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="w-4 h-4 mr-2" /> JSON Data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Editable Formats</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('docx')} data-testid="export-docx">
          <FileSpreadsheet className="w-4 h-4 mr-2" /> Word (.docx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('latex')} data-testid="export-latex">
          <FileCode className="w-4 h-4 mr-2" /> LaTeX (.tex)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ============ TEMPLATES GRID ============
const TemplatesGrid = ({ onSelectTemplate }) => {
  const [templates, setTemplates] = useState([]);
  useEffect(() => {
    fetch(`${API}/templates`)
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []))
      .catch(() => {});
  }, []);
  
  if (templates.length === 0) return null;
  
  return (
    <div className="mb-6" data-testid="templates-grid">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-base font-medium text-foreground-1">Quick Start Templates</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {templates.map((template, idx) => {
          const Icon = TEMPLATE_ICONS[template.icon] || FileText;
          return (
            <motion.button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className="p-3 bg-surface-1 border border-border-1 rounded-lg hover:border-primary hover:bg-surface-2 transition-colors text-left group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 10px 20px -10px rgba(34, 197, 94, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              data-testid={`template-${template.id}`}
            >
              <Icon className="w-5 h-5 text-muted-1 group-hover:text-primary mb-2 transition-colors" />
              <p className="text-sm font-medium text-foreground-1 mb-1">{template.name}</p>
              <p className="text-xs text-muted-1 leading-tight">{template.description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// ============ CUSTOM AGENT CONFIG DIALOG ============
const CustomAgentDialog = ({ agentConfigs, onSave, disabled }) => {
  const [open, setOpen] = useState(false);
  const [configs, setConfigs] = useState(agentConfigs);
  
  useEffect(() => {
    if (open) setConfigs(agentConfigs);
  }, [open, agentConfigs]);
  
  const handleSave = () => {
    onSave(configs);
    setOpen(false);
    toast.success('Custom agent configuration saved');
  };
  
  const handleReset = () => {
    const empty = { researcher: {}, fact_checker: {}, writer: {} };
    setConfigs(empty);
    onSave(empty);
    toast.success('Reset to default agent configuration');
  };
  
  const updateField = (agent, field, value) => {
    setConfigs(prev => ({ ...prev, [agent]: { ...prev[agent], [field]: value } }));
  };
  
  const hasCustomConfig = Object.values(agentConfigs).some(c => Object.keys(c || {}).length > 0);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} data-testid="btn-customize-agents">
          <UserCog className="w-4 h-4 mr-2" />
          {hasCustomConfig ? 'Agents Customized' : 'Customize Agents'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-surface-1 border-border-1">
        <DialogHeader>
          <DialogTitle className="text-xl">Custom Agent Configuration</DialogTitle>
          <DialogDescription>
            Define personalities, expertise areas, and goals for each agent. Leave fields blank to use defaults.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="researcher" className="mt-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="researcher" data-testid="tab-researcher">
              <Search className="w-4 h-4 mr-1 text-researcher" /> Researcher
            </TabsTrigger>
            <TabsTrigger value="fact_checker" data-testid="tab-fact-checker">
              <ShieldAlert className="w-4 h-4 mr-1 text-fact-checker" /> Fact-Checker
            </TabsTrigger>
            <TabsTrigger value="writer" data-testid="tab-writer">
              <PenTool className="w-4 h-4 mr-1 text-writer" /> Writer
            </TabsTrigger>
          </TabsList>
          
          {['researcher', 'fact_checker', 'writer'].map(agent => (
            <TabsContent key={agent} value={agent} className="space-y-4 mt-4">
              <div>
                <Label htmlFor={`${agent}-expertise`} className="text-sm">Expertise / Domain</Label>
                <Input
                  id={`${agent}-expertise`}
                  placeholder="e.g., AI/ML, Healthcare, Finance, Climate Science"
                  value={configs[agent]?.expertise || ''}
                  onChange={(e) => updateField(agent, 'expertise', e.target.value)}
                  className="mt-1 bg-surface-2 border-border-1"
                  data-testid={`input-${agent}-expertise`}
                />
                <p className="text-xs text-muted-1 mt-1">Domain expertise this agent will apply</p>
              </div>
              
              <div>
                <Label htmlFor={`${agent}-role`} className="text-sm">Role Title (optional)</Label>
                <Input
                  id={`${agent}-role`}
                  placeholder="e.g., Senior AI Researcher"
                  value={configs[agent]?.role || ''}
                  onChange={(e) => updateField(agent, 'role', e.target.value)}
                  className="mt-1 bg-surface-2 border-border-1"
                />
              </div>
              
              <div>
                <Label htmlFor={`${agent}-backstory`} className="text-sm">Personality / Backstory (optional)</Label>
                <Textarea
                  id={`${agent}-backstory`}
                  placeholder="e.g., You are a meticulous researcher with 15 years of experience in..."
                  value={configs[agent]?.backstory || ''}
                  onChange={(e) => updateField(agent, 'backstory', e.target.value)}
                  className="mt-1 bg-surface-2 border-border-1 min-h-[80px]"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor={`${agent}-goal`} className="text-sm">Custom Goal (optional)</Label>
                <Textarea
                  id={`${agent}-goal`}
                  placeholder="Override the default goal for this agent..."
                  value={configs[agent]?.goal || ''}
                  onChange={(e) => updateField(agent, 'goal', e.target.value)}
                  className="mt-1 bg-surface-2 border-border-1"
                  rows={2}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleReset} data-testid="btn-reset-agents">
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90" data-testid="btn-save-agents">
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============ SOURCES PANEL ============
const SourcesPanel = ({ sources, credibilityScore }) => {
  if (!sources || sources.length === 0) return null;
  
  return (
    <Card className="bg-surface-1 border-border-1" data-testid="sources-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-xl text-researcher">
            <Shield className="w-5 h-5" />
            Verified Sources & Credibility
          </CardTitle>
          {credibilityScore !== null && credibilityScore !== undefined && (
            <CredibilityBadge 
              score={credibilityScore} 
              level={credibilityScore >= 80 ? 'high' : credibilityScore >= 60 ? 'medium' : 'low'} 
              size="lg" 
            />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((source, idx) => {
            // Use verified_url if available, else fallback to original url
            const linkUrl = source.verified_url || source.url;
            const isVerified = source.verified === true;
            const isBroken = source.verified === false;
            
            return (
              <motion.div 
                key={idx} 
                className="p-3 bg-terminal-bg rounded-lg border border-border-1 hover:border-researcher/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <a
                      href={linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-researcher hover:underline break-all inline-flex items-start gap-1 group"
                      data-testid="source-link"
                    >
                      <span className="line-clamp-2">{linkUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                    {source.title && (
                      <p className="text-xs text-muted-1 mt-1">{source.title}</p>
                    )}
                    {source.verified_url && source.verified_url !== source.url && (
                      <p className="text-xs text-muted-1 mt-1">
                        <span className="italic">Redirected from:</span> <span className="break-all">{source.url}</span>
                      </p>
                    )}
                  </div>
                  <CredibilityBadge 
                    score={source.credibility_score} 
                    level={source.credibility_level} 
                    verified={source.verified} 
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {isVerified && (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Accessible {source.status_code && `(${source.status_code})`}
                    </span>
                  )}
                  {isBroken && (
                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Not accessible
                    </span>
                  )}
                  {source.reasons && source.reasons.map((reason, ridx) => (
                    <span key={ridx} className="text-xs text-muted-1 bg-surface-2 px-2 py-0.5 rounded">
                      {reason}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ============ RESULTS PANEL ============
const ResultsPanel = ({ session, isVisible }) => {
  if (!isVisible || !session) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 space-y-6"
      data-testid="results-panel"
    >
      <div className="flex justify-end">
        <ExportMenu sessionId={session.id} disabled={false} />
      </div>

      <SourcesPanel sources={session.sources} credibilityScore={session.credibility_score} />

      {session.contradictions_found && session.contradictions_found.length > 0 && (
        <Card className="bg-surface-1 border-border-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl text-fact-checker">
              <AlertTriangle className="w-5 h-5" />
              Issues Identified by Fact-Checker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {session.contradictions_found.map((item, idx) => (
                <motion.li 
                  key={idx} 
                  className="flex items-start gap-2 text-base text-foreground-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <span className="text-fact-checker mt-0.5">•</span>
                  {item}
                </motion.li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {session.final_report && (
        <Card className="bg-surface-1 border-border-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl text-writer">
              <PenTool className="w-5 h-5" />
              Final Research Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="text-base text-foreground-1 leading-relaxed whitespace-pre-wrap">
                {session.final_report}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

// ============ NAVIGATION ============
const Navigation = () => {
  const location = useLocation();
  return (
    <nav className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant={location.pathname === '/' ? 'default' : 'ghost'} size="sm">
            <Zap className="w-4 h-4 mr-2" /> New Research
          </Button>
        </Link>
        <Link to="/history">
          <Button variant={location.pathname === '/history' ? 'default' : 'ghost'} size="sm" data-testid="nav-history">
            <History className="w-4 h-4 mr-2" /> History
          </Button>
        </Link>
      </div>
      <ThemeToggle />
    </nav>
  );
};

// ============ HISTORY PAGE ============
const HistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/research`);
      if (response.ok) setSessions(await response.json());
    } catch (error) {
      toast.error('Failed to load history');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleDelete = async (sessionId) => {
    try {
      const response = await fetch(`${API}/research/${sessionId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Session deleted');
        fetchSessions();
        if (selectedSession?.id === sessionId) setSelectedSession(null);
      }
    } catch { toast.error('Delete failed'); }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'researching': case 'fact_checking': case 'writing':
        return <Loader2 className="w-4 h-4 text-researcher animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-1" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'researching': case 'fact_checking': case 'writing':
        return 'bg-researcher/20 text-researcher border-researcher/40';
      default: return 'bg-surface-2 text-muted-1 border-border-1';
    }
  };

  const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleString() : 'Unknown';

  return (
    <div className="min-h-screen bg-background-1 text-foreground-1">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <motion.div 
              className="p-2 rounded-lg bg-primary/20"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Zap className="w-7 h-7 text-primary" />
            </motion.div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground-1">MARS</h1>
          </div>
          <p className="text-muted-1 text-base ml-14">Multi-Agent Research System — Research History</p>
        </header>

        <Navigation />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="bg-surface-1 border-border-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <History className="w-5 h-5" /> Research Sessions
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={fetchSessions}>
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-1" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-1">No research sessions yet</div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session, idx) => (
                        <motion.div
                          key={session.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedSession?.id === session.id ? 'bg-surface-2 border-border-2' : 'bg-surface-1 border-border-1 hover:bg-surface-2/50'}`}
                          onClick={() => setSelectedSession(session)}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          data-testid="history-session-item"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-medium text-foreground-1 truncate">{session.topic}</p>
                              <p className="text-sm text-muted-1 mt-1">{formatDate(session.created_at)}</p>
                              {session.credibility_score !== null && session.credibility_score !== undefined && session.credibility_score > 0 && (
                                <div className="mt-1">
                                  <CredibilityBadge 
                                    score={session.credibility_score} 
                                    level={session.credibility_score >= 80 ? 'high' : session.credibility_score >= 60 ? 'medium' : 'low'} 
                                  />
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className={`shrink-0 ${getStatusColor(session.status)}`}>
                              {getStatusIcon(session.status)}
                              <span className="ml-1 capitalize">{session.status}</span>
                            </Badge>
                          </div>
                          {session.progress > 0 && session.progress < 100 && (
                            <Progress value={session.progress} className="h-1 mt-2" />
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedSession ? (
              <Card className="bg-surface-1 border-border-1">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedSession.topic}</CardTitle>
                      <p className="text-sm text-muted-1 mt-1">
                        Created: {formatDate(selectedSession.created_at)}
                        {selectedSession.completed_at && (<> • Completed: {formatDate(selectedSession.completed_at)}</>)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ExportMenu sessionId={selectedSession.id} disabled={selectedSession.status !== 'completed'} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-surface-1 border-border-1">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this research session? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(selectedSession.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[550px] pr-4">
                    {selectedSession.status === 'error' && selectedSession.error_message && (
                      <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/40">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-400">Error</p>
                            <p className="text-sm text-foreground-1 mt-1">{selectedSession.error_message}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedSession.sources && selectedSession.sources.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-base font-medium text-researcher mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Sources ({selectedSession.credibility_score}/100 avg)
                        </h4>
                        <div className="space-y-2">
                          {selectedSession.sources.map((src, idx) => {
                            const linkUrl = src.verified_url || src.url;
                            return (
                              <div key={idx} className="p-2 bg-terminal-bg rounded border border-border-1">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-researcher hover:underline break-all flex-1 inline-flex items-start gap-1">
                                    <span className="line-clamp-1">{linkUrl}</span>
                                    <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
                                  </a>
                                  <CredibilityBadge score={src.credibility_score} level={src.credibility_level} verified={src.verified} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {selectedSession.contradictions_found && selectedSession.contradictions_found.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-base font-medium text-fact-checker mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Issues Identified
                        </h4>
                        <ul className="space-y-1">
                          {selectedSession.contradictions_found.map((item, idx) => (
                            <li key={idx} className="text-sm text-foreground-1 flex items-start gap-2">
                              <span className="text-fact-checker">•</span>{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedSession.final_report && (
                      <div className="mb-6">
                        <h4 className="text-base font-medium text-writer mb-2 flex items-center gap-2">
                          <PenTool className="w-4 h-4" /> Final Report
                        </h4>
                        <div className="text-sm text-foreground-1 whitespace-pre-wrap bg-terminal-bg p-4 rounded-lg border border-border-1">
                          {selectedSession.final_report}
                        </div>
                      </div>
                    )}

                    {selectedSession.researcher_output && (
                      <div className="mb-6">
                        <h4 className="text-base font-medium text-researcher mb-2 flex items-center gap-2">
                          <Search className="w-4 h-4" /> Research Findings
                        </h4>
                        <div className="text-sm text-muted-1 whitespace-pre-wrap bg-terminal-bg p-4 rounded-lg border border-border-1 max-h-[200px] overflow-y-auto">
                          {selectedSession.researcher_output}
                        </div>
                      </div>
                    )}

                    {selectedSession.fact_checker_output && (
                      <div className="mb-6">
                        <h4 className="text-base font-medium text-fact-checker mb-2 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" /> Fact-Check Analysis
                        </h4>
                        <div className="text-sm text-muted-1 whitespace-pre-wrap bg-terminal-bg p-4 rounded-lg border border-border-1 max-h-[200px] overflow-y-auto">
                          {selectedSession.fact_checker_output}
                        </div>
                      </div>
                    )}

                    {!selectedSession.final_report && !selectedSession.error_message && (
                      <div className="text-center py-8 text-muted-1">
                        {selectedSession.status === 'pending' ? 'Research has not started yet' : (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span>Research in progress...</span>
                            {selectedSession.progress > 0 && (
                              <Progress value={selectedSession.progress} className="w-48 h-2 mt-2" />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-surface-1 border-border-1 h-full min-h-[600px] flex items-center justify-center">
                <div className="text-center text-muted-1">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base">Select a session to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <footer className="mt-12 pt-6 border-t border-border-1 text-center">
          <p className="text-sm text-muted-1">
            Powered by CrewAI + GPT-5.2 Thinking • Sequential Process Architecture
          </p>
        </footer>
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
};

// ============ MAIN DASHBOARD ============
const Dashboard = () => {
  const [topic, setTopic] = useState('The impact of room-temperature superconductors on 2026 energy grids');
  const [isResearching, setIsResearching] = useState(false);
  const [fastMode, setFastMode] = useState(true);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [agentLogs, setAgentLogs] = useState({ researcher: [], fact_checker: [], writer: [] });
  const [agentStatus, setAgentStatus] = useState({ researcher: 'idle', fact_checker: 'idle', writer: 'idle' });
  const [agentConfigs, setAgentConfigs] = useState({ researcher: {}, fact_checker: {}, writer: {} });
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const getTime = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const addLog = useCallback((agent, message, type = 'info') => {
    setAgentLogs(prev => ({ ...prev, [agent]: [...prev[agent], { time: getTime(), message, type }] }));
  }, []);

  const handleSelectTemplate = (template) => {
    setTopic(template.prompt);
    toast.success(`Loaded template: ${template.name}`, { duration: 2000 });
  };

  const connectToStream = useCallback((sessionId) => {
    if (eventSourceRef.current) eventSourceRef.current.close();

    const eventSource = new EventSource(`${API}/research/stream/${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data);
        switch (eventData.type) {
          case 'connected':
            addLog('researcher', 'Connected to research stream'); break;
          case 'status':
            addLog('researcher', eventData.message); break;
          case 'progress':
            setProgress(eventData.data?.progress || 0); break;
          case 'log':
            if (eventData.agent) addLog(eventData.agent, eventData.message); break;
          case 'agent_start':
            if (eventData.agent === 'researcher') {
              setCurrentStep(0);
              setAgentStatus(prev => ({ ...prev, researcher: 'active' }));
              addLog('researcher', eventData.message);
            } else if (eventData.agent === 'fact_checker') {
              setCurrentStep(1);
              setAgentStatus(prev => ({ ...prev, researcher: 'complete', fact_checker: 'active' }));
              addLog('fact_checker', eventData.message);
              addLog('fact_checker', 'Aggressive scrutiny mode engaged...');
            } else if (eventData.agent === 'writer') {
              setCurrentStep(2);
              setAgentStatus(prev => ({ ...prev, fact_checker: 'complete', writer: 'active' }));
              addLog('writer', eventData.message);
            }
            break;
          case 'agent_complete':
            if (eventData.agent === 'researcher') {
              addLog('researcher', 'Research phase completed');
              if (eventData.data?.sources_count) {
                addLog('researcher', `Found ${eventData.data.sources_count} sources (credibility: ${eventData.data.credibility_score}/100)`);
              }
              if (eventData.data?.output) addLog('researcher', `Preview: ${eventData.data.output.substring(0, 200)}...`);
            } else if (eventData.agent === 'fact_checker') {
              addLog('fact_checker', 'Critical analysis completed');
              if (eventData.data?.output) addLog('fact_checker', `Analysis: ${eventData.data.output.substring(0, 200)}...`);
            } else if (eventData.agent === 'writer') {
              addLog('writer', 'Final report drafted');
              if (eventData.data?.output) addLog('writer', `Summary: ${eventData.data.output.substring(0, 200)}...`);
            }
            break;
          case 'complete':
          case 'completed':
            setCurrentStep(3);
            setProgress(100);
            setAgentStatus({ researcher: 'complete', fact_checker: 'complete', writer: 'complete' });
            addLog('writer', 'Research complete! Final report ready.');
            setIsResearching(false);
            toast.success('Research completed successfully!');
            fetchSession(sessionId);
            eventSource.close(); break;
          case 'error':
            addLog('researcher', `Error: ${eventData.message}`, 'error');
            setIsResearching(false);
            setProgress(0);
            toast.error(eventData.message || 'Research failed');
            eventSource.close(); break;
          case 'heartbeat': break;
          default: break;
        }
      } catch (e) { console.error('Error parsing event:', e); }
    };

    eventSource.onerror = () => {
      addLog('researcher', 'Connection interrupted, attempting to reconnect...', 'error');
      eventSource.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isResearching) connectToStream(sessionId);
      }, 3000);
    };
  }, [addLog, isResearching]);

  const startResearch = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a research topic');
      return;
    }
    setIsResearching(true);
    setCurrentStep(0);
    setProgress(0);
    setCurrentSession(null);
    setAgentLogs({ researcher: [], fact_checker: [], writer: [] });
    setAgentStatus({ researcher: 'active', fact_checker: 'idle', writer: 'idle' });

    try {
      // Only send configs that have content
      const cleanConfig = (config) => {
        const cleaned = {};
        Object.entries(config || {}).forEach(([k, v]) => {
          if (v && v.trim()) cleaned[k] = v.trim();
        });
        return Object.keys(cleaned).length > 0 ? cleaned : null;
      };
      
      const body = {
        topic,
        fast_mode: fastMode,
        researcher_config: cleanConfig(agentConfigs.researcher),
        fact_checker_config: cleanConfig(agentConfigs.fact_checker),
        writer_config: cleanConfig(agentConfigs.writer),
      };
      
      const response = await fetch(`${API}/research/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error('Failed to start research');
      
      const data = await response.json();
      toast.success(fastMode ? 'Research started (Fast Mode)!' : 'Research started!');
      addLog('researcher', `Starting ${fastMode ? 'FAST ' : ''}research on: "${topic}"`);
      addLog('researcher', 'Searching for credible sources...');
      connectToStream(data.session_id);
    } catch (error) {
      console.error('Research error:', error);
      toast.error('Failed to start research');
      setIsResearching(false);
    }
  };

  const fetchSession = async (sessionId) => {
    try {
      const response = await fetch(`${API}/research/${sessionId}`);
      if (response.ok) setCurrentSession(await response.json());
    } catch (error) { console.error('Error fetching session:', error); }
  };

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background-1 text-foreground-1">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <motion.header 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div 
              className="p-2 rounded-lg bg-primary/20"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <Zap className="w-7 h-7 text-primary" />
            </motion.div>
            <h1 className="text-5xl font-bold tracking-tight text-foreground-1">MARS</h1>
          </div>
          <p className="text-muted-1 text-base ml-14">
            Multi-Agent Research System — Deep-dive research powered by AI agents
          </p>
        </motion.header>

        <Navigation />

        {!isResearching && <TemplatesGrid onSelectTemplate={handleSelectTemplate} />}

        <Card className="bg-surface-1 border-border-1 mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-base text-muted-1 mb-2 block">Research Topic</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a complex topic to research..."
                  className="bg-terminal-bg border-border-1 text-foreground-1 placeholder:text-muted-2 h-12 text-base"
                  disabled={isResearching}
                  data-testid="input-topic"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={startResearch}
                  disabled={isResearching || !topic.trim()}
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-medium text-base"
                  data-testid="btn-start-research"
                >
                  {isResearching ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Researching...</>
                  ) : (
                    <><Play className="w-4 h-4 mr-2" />Start Research</>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-1 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Rocket className={`w-5 h-5 ${fastMode ? 'text-primary' : 'text-muted-1'}`} />
                <div>
                  <Label htmlFor="fast-mode" className="text-base text-foreground-1 cursor-pointer">
                    Fast Mode
                  </Label>
                  <p className="text-sm text-muted-1">
                    {fastMode ? '~4-5x faster with GPT-4o Mini and focused prompts' : 'Comprehensive research with GPT-5.2 (slower)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CustomAgentDialog 
                  agentConfigs={agentConfigs} 
                  onSave={setAgentConfigs}
                  disabled={isResearching}
                />
                <Switch
                  id="fast-mode"
                  checked={fastMode}
                  onCheckedChange={setFastMode}
                  disabled={isResearching}
                  data-testid="switch-fast-mode"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <ProcessFlow currentStep={currentStep} progress={progress} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AgentCard title="Lead Researcher" icon={Search} color="#0ea5e9"
            status={agentStatus.researcher} logs={agentLogs.researcher}
            description="Finding credible sources" testId="agent-card-researcher" />
          <AgentCard title="Fact-Checker" icon={ShieldAlert} color="#f97316"
            status={agentStatus.fact_checker} logs={agentLogs.fact_checker}
            description="Aggressive scrutiny mode" testId="agent-card-fact-checker" />
          <AgentCard title="Technical Writer" icon={PenTool} color="#10b981"
            status={agentStatus.writer} logs={agentLogs.writer}
            description="Synthesizing final report" testId="agent-card-writer" />
        </div>

        <ResultsPanel session={currentSession} isVisible={currentStep === 3 && currentSession !== null} />

        <footer className="mt-12 pt-6 border-t border-border-1 text-center">
          <p className="text-sm text-muted-1">
            Powered by CrewAI + {fastMode ? 'GPT-4o Mini (Fast Mode)' : 'GPT-5.2 Thinking'} • Sequential Process Architecture
          </p>
        </footer>
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
