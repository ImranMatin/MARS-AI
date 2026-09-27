import { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Search, 
  ShieldAlert, 
  PenTool, 
  Play, 
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  History,
  Download,
  FileText,
  FileJson,
  Trash2,
  ArrowLeft,
  RefreshCw,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Terminal Feed Component
const TerminalFeed = ({ logs, agentColor, isActive }) => {
  const scrollRef = useRef(null);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div 
      ref={scrollRef}
      className="bg-zinc-950 border border-zinc-800 rounded-md p-4 font-mono text-xs h-[280px] overflow-y-auto terminal-scroll relative"
      data-testid="terminal-feed"
    >
      <div className="space-y-1">
        {logs.length === 0 && (
          <div className="text-zinc-600 italic">Waiting for agent to start...</div>
        )}
        {logs.map((log, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
            className="flex gap-2"
            data-testid="terminal-log-entry"
          >
            <span className="text-zinc-600 select-none">[{log.time}]</span>
            <span style={{ color: log.type === 'error' ? '#ef4444' : agentColor }}>
              {log.message}
            </span>
          </motion.div>
        ))}
        {isActive && (
          <div className="flex items-center gap-1">
            <span className="text-zinc-600">&gt;</span>
            <span className="terminal-cursor" style={{ background: agentColor }}></span>
          </div>
        )}
      </div>
    </div>
  );
};

// Agent Card Component
const AgentCard = ({ 
  title, 
  icon: Icon, 
  color, 
  status, 
  logs, 
  description,
  testId 
}) => {
  const isActive = status === 'active';
  const isComplete = status === 'complete';
  const isIdle = status === 'idle';

  const glowClass = isActive ? 
    (color === '#0ea5e9' ? 'glow-researcher' : 
     color === '#f97316' ? 'glow-fact-checker' : 
     'glow-writer') : '';

  return (
    <motion.div
      layout
      className={`
        bg-zinc-900 border border-zinc-800 p-6 rounded-lg relative overflow-hidden
        transition-opacity duration-300
        ${isIdle ? 'opacity-50' : 'opacity-100'}
        ${glowClass}
      `}
      data-testid={testId}
    >
      {/* Tracing beam effect when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div 
            className="absolute inset-x-0 top-0 h-[2px] tracing-beam"
            style={{ '--beam-color': color }}
          />
        </motion.div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
            <p className="text-xs text-zinc-500">{description}</p>
          </div>
        </div>
        <Badge 
          variant={isActive ? 'default' : isComplete ? 'secondary' : 'outline'}
          className={`
            ${isActive ? 'bg-status-active text-white animate-pulse-glow' : ''}
            ${isComplete ? 'bg-zinc-700 text-zinc-300' : ''}
          `}
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

// Process Flow Component
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
      {/* Progress Bar */}
      {progress > 0 && progress < 100 && (
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Research Progress</span>
            <span className="text-sm font-medium text-zinc-300">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const Icon = step.icon;
          
          return (
            <div key={step.name} className="flex items-center">
              <motion.div
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-full border
                  ${status === 'complete' ? 'border-zinc-600 bg-zinc-800' : ''}
                  ${status === 'active' ? 'border-2' : ''}
                  ${status === 'idle' ? 'border-zinc-800 bg-zinc-900/50 opacity-50' : ''}
                `}
                style={{ 
                  borderColor: status === 'active' ? step.color : undefined,
                  boxShadow: status === 'active' ? `0 0 15px -3px ${step.color}` : undefined
                }}
                animate={status === 'active' ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Icon 
                  className="w-4 h-4" 
                  style={{ color: status !== 'idle' ? step.color : '#71717a' }} 
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: status !== 'idle' ? '#fafafa' : '#71717a' }}
                >
                  {step.name}
                </span>
                {status === 'complete' && (
                  <CheckCircle2 className="w-4 h-4 text-status-active" />
                )}
              </motion.div>
              {index < steps.length - 1 && (
                <div className="w-8 h-0.5 mx-2">
                  <div 
                    className="h-full rounded transition-colors duration-500"
                    style={{ 
                      backgroundColor: currentStep > index ? step.color : '#27272a'
                    }}
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

// Export Menu Component
const ExportMenu = ({ sessionId, disabled }) => {
  const handleExport = async (format) => {
    try {
      const response = await fetch(`${API}/research/${sessionId}/export/${format}`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research-report-${sessionId.slice(0, 8)}.${format === 'markdown' ? 'md' : 'json'}`;
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
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('markdown')}>
          <FileText className="w-4 h-4 mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="w-4 h-4 mr-2" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Results Panel Component
const ResultsPanel = ({ session, isVisible }) => {
  if (!isVisible || !session) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 space-y-6"
      data-testid="results-panel"
    >
      {/* Export Actions */}
      <div className="flex justify-end">
        <ExportMenu sessionId={session.id} disabled={false} />
      </div>

      {/* Contradictions Found */}
      {session.contradictions_found && session.contradictions_found.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-fact-checker">
              <AlertTriangle className="w-5 h-5" />
              Issues Identified by Fact-Checker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {session.contradictions_found.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                  <span className="text-fact-checker mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Final Report */}
      {session.final_report && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-writer">
              <PenTool className="w-5 h-5" />
              Final Research Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {session.final_report}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

// Navigation Component
const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="flex items-center gap-4 mb-8">
      <Link to="/">
        <Button 
          variant={location.pathname === '/' ? 'default' : 'ghost'}
          size="sm"
        >
          <Zap className="w-4 h-4 mr-2" />
          New Research
        </Button>
      </Link>
      <Link to="/history">
        <Button 
          variant={location.pathname === '/history' ? 'default' : 'ghost'}
          size="sm"
          data-testid="nav-history"
        >
          <History className="w-4 h-4 mr-2" />
          History
        </Button>
      </Link>
    </nav>
  );
};

// History Page Component
const HistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/research`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (sessionId) => {
    try {
      const response = await fetch(`${API}/research/${sessionId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('Session deleted');
        fetchSessions();
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-status-active" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-status-error" />;
      case 'researching':
      case 'fact_checking':
      case 'writing':
        return <Loader2 className="w-4 h-4 text-researcher animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-status-idle" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-status-active/20 text-status-active border-status-active/30';
      case 'error':
        return 'bg-status-error/20 text-status-error border-status-error/30';
      case 'researching':
      case 'fact_checking':
      case 'writing':
        return 'bg-researcher/20 text-researcher border-researcher/30';
      default:
        return 'bg-zinc-700/20 text-zinc-400 border-zinc-600/30';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
              MARS
            </h1>
          </div>
          <p className="text-zinc-400 text-sm ml-14">
            Multi-Agent Research System — Research History
          </p>
        </header>

        <Navigation />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <div className="lg:col-span-1">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="w-5 h-5" />
                    Research Sessions
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
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      No research sessions yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedSession?.id === session.id
                              ? 'bg-zinc-800 border-zinc-600'
                              : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50'
                          }`}
                          onClick={() => setSelectedSession(session)}
                          data-testid="history-session-item"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-200 truncate">
                                {session.topic}
                              </p>
                              <p className="text-xs text-zinc-500 mt-1">
                                {formatDate(session.created_at)}
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`shrink-0 ${getStatusColor(session.status)}`}
                            >
                              {getStatusIcon(session.status)}
                              <span className="ml-1 capitalize">{session.status}</span>
                            </Badge>
                          </div>
                          {session.progress > 0 && session.progress < 100 && (
                            <Progress value={session.progress} className="h-1 mt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Session Details */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedSession.topic}</CardTitle>
                      <p className="text-xs text-zinc-500 mt-1">
                        Created: {formatDate(selectedSession.created_at)}
                        {selectedSession.completed_at && (
                          <> • Completed: {formatDate(selectedSession.completed_at)}</>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ExportMenu sessionId={selectedSession.id} disabled={selectedSession.status !== 'completed'} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Session</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this research session? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(selectedSession.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[550px] pr-4">
                    {/* Error Message */}
                    {selectedSession.status === 'error' && selectedSession.error_message && (
                      <div className="mb-6 p-4 rounded-lg bg-status-error/10 border border-status-error/30">
                        <div className="flex items-start gap-2">
                          <XCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-status-error">Error</p>
                            <p className="text-sm text-zinc-300 mt-1">{selectedSession.error_message}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Contradictions */}
                    {selectedSession.contradictions_found && selectedSession.contradictions_found.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-fact-checker mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Issues Identified
                        </h4>
                        <ul className="space-y-1">
                          {selectedSession.contradictions_found.map((item, idx) => (
                            <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                              <span className="text-fact-checker">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Final Report */}
                    {selectedSession.final_report && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-writer mb-2 flex items-center gap-2">
                          <PenTool className="w-4 h-4" />
                          Final Report
                        </h4>
                        <div className="text-sm text-zinc-300 whitespace-pre-wrap bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                          {selectedSession.final_report}
                        </div>
                      </div>
                    )}

                    {/* Researcher Output */}
                    {selectedSession.researcher_output && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-researcher mb-2 flex items-center gap-2">
                          <Search className="w-4 h-4" />
                          Research Findings
                        </h4>
                        <div className="text-sm text-zinc-400 whitespace-pre-wrap bg-zinc-950 p-4 rounded-lg border border-zinc-800 max-h-[200px] overflow-y-auto">
                          {selectedSession.researcher_output}
                        </div>
                      </div>
                    )}

                    {/* Fact-Checker Output */}
                    {selectedSession.fact_checker_output && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-fact-checker mb-2 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4" />
                          Fact-Check Analysis
                        </h4>
                        <div className="text-sm text-zinc-400 whitespace-pre-wrap bg-zinc-950 p-4 rounded-lg border border-zinc-800 max-h-[200px] overflow-y-auto">
                          {selectedSession.fact_checker_output}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {!selectedSession.final_report && !selectedSession.error_message && (
                      <div className="text-center py-8 text-zinc-500">
                        {selectedSession.status === 'pending' ? (
                          'Research has not started yet'
                        ) : (
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
              <Card className="bg-zinc-900 border-zinc-800 h-full min-h-[600px] flex items-center justify-center">
                <div className="text-center text-zinc-500">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a session to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-600">
            Powered by CrewAI + GPT-5.2 Thinking • Sequential Process Architecture
          </p>
        </footer>
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [topic, setTopic] = useState('The impact of room-temperature superconductors on 2026 energy grids');
  const [isResearching, setIsResearching] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [agentLogs, setAgentLogs] = useState({
    researcher: [],
    fact_checker: [],
    writer: []
  });
  const [agentStatus, setAgentStatus] = useState({
    researcher: 'idle',
    fact_checker: 'idle',
    writer: 'idle'
  });
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const getTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const addLog = useCallback((agent, message, type = 'info') => {
    setAgentLogs(prev => ({
      ...prev,
      [agent]: [...prev[agent], { time: getTime(), message, type }]
    }));
  }, []);

  const connectToStream = useCallback((sessionId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${API}/research/stream/${sessionId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data);
        
        switch (eventData.type) {
          case 'connected':
            addLog('researcher', 'Connected to research stream');
            break;
          
          case 'status':
            addLog('researcher', eventData.message);
            break;

          case 'progress':
            setProgress(eventData.data?.progress || 0);
            break;

          case 'log':
            if (eventData.agent) {
              addLog(eventData.agent, eventData.message);
            }
            break;

          case 'agent_start':
            if (eventData.agent === 'researcher') {
              setCurrentStep(0);
              setAgentStatus(prev => ({ ...prev, researcher: 'active' }));
              addLog('researcher', eventData.message);
            } else if (eventData.agent === 'fact_checker') {
              setCurrentStep(1);
              setAgentStatus(prev => ({ 
                ...prev, 
                researcher: 'complete', 
                fact_checker: 'active' 
              }));
              addLog('fact_checker', eventData.message);
              addLog('fact_checker', 'Aggressive scrutiny mode engaged...');
            } else if (eventData.agent === 'writer') {
              setCurrentStep(2);
              setAgentStatus(prev => ({ 
                ...prev, 
                fact_checker: 'complete', 
                writer: 'active' 
              }));
              addLog('writer', eventData.message);
            }
            break;

          case 'agent_complete':
            if (eventData.agent === 'researcher') {
              addLog('researcher', 'Research phase completed');
              addLog('researcher', 'Found sources and compiled findings');
              if (eventData.data?.output) {
                const preview = eventData.data.output.substring(0, 200);
                addLog('researcher', `Preview: ${preview}...`);
              }
            } else if (eventData.agent === 'fact_checker') {
              addLog('fact_checker', 'Critical analysis completed');
              addLog('fact_checker', 'Issues identified - proceeding with caution');
              if (eventData.data?.output) {
                const preview = eventData.data.output.substring(0, 200);
                addLog('fact_checker', `Analysis: ${preview}...`);
              }
            } else if (eventData.agent === 'writer') {
              addLog('writer', 'Final report drafted');
              if (eventData.data?.output) {
                const preview = eventData.data.output.substring(0, 200);
                addLog('writer', `Summary: ${preview}...`);
              }
            }
            break;

          case 'complete':
          case 'completed':
            setCurrentStep(3);
            setProgress(100);
            setAgentStatus({ 
              researcher: 'complete', 
              fact_checker: 'complete', 
              writer: 'complete' 
            });
            addLog('writer', 'Research complete! Final report ready.');
            setIsResearching(false);
            toast.success('Research completed successfully!');
            fetchSession(sessionId);
            eventSource.close();
            break;

          case 'error':
            addLog('researcher', `Error: ${eventData.message}`, 'error');
            setIsResearching(false);
            setProgress(0);
            toast.error(eventData.message || 'Research failed');
            eventSource.close();
            break;

          case 'heartbeat':
            // Silent heartbeat - connection is alive
            break;

          default:
            break;
        }
      } catch (e) {
        console.error('Error parsing event:', e);
      }
    };

    eventSource.onerror = () => {
      addLog('researcher', 'Connection interrupted, attempting to reconnect...', 'error');
      eventSource.close();
      
      // Attempt reconnection after delay
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (isResearching) {
          connectToStream(sessionId);
        }
      }, 3000);
    };
  }, [addLog, isResearching]);

  const startResearch = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a research topic');
      return;
    }

    // Reset state
    setIsResearching(true);
    setCurrentStep(0);
    setProgress(0);
    setCurrentSession(null);
    setAgentLogs({ researcher: [], fact_checker: [], writer: [] });
    setAgentStatus({ researcher: 'active', fact_checker: 'idle', writer: 'idle' });

    try {
      // Start research session
      const response = await fetch(`${API}/research/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });

      if (!response.ok) throw new Error('Failed to start research');
      
      const data = await response.json();
      toast.success('Research started!');
      addLog('researcher', `Starting research on: "${topic}"`);
      addLog('researcher', 'Searching for credible sources...');

      // Connect to SSE stream
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
      if (response.ok) {
        const session = await response.json();
        setCurrentSession(session);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100">
              MARS
            </h1>
          </div>
          <p className="text-zinc-400 text-sm ml-14">
            Multi-Agent Research System — Deep-dive research powered by AI agents
          </p>
        </header>

        <Navigation />

        {/* Input Section */}
        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm text-zinc-400 mb-2 block">Research Topic</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a complex topic to research..."
                  className="bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 h-12"
                  disabled={isResearching}
                  data-testid="input-topic"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={startResearch}
                  disabled={isResearching || !topic.trim()}
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-medium"
                  data-testid="btn-start-research"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Research
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Process Flow */}
        <ProcessFlow currentStep={currentStep} progress={progress} />

        {/* Agent Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AgentCard
            title="Lead Researcher"
            icon={Search}
            color="#0ea5e9"
            status={agentStatus.researcher}
            logs={agentLogs.researcher}
            description="Finding credible sources"
            testId="agent-card-researcher"
          />
          <AgentCard
            title="Fact-Checker"
            icon={ShieldAlert}
            color="#f97316"
            status={agentStatus.fact_checker}
            logs={agentLogs.fact_checker}
            description="Aggressive scrutiny mode"
            testId="agent-card-fact-checker"
          />
          <AgentCard
            title="Technical Writer"
            icon={PenTool}
            color="#10b981"
            status={agentStatus.writer}
            logs={agentLogs.writer}
            description="Synthesizing final report"
            testId="agent-card-writer"
          />
        </div>

        {/* Results Panel */}
        <ResultsPanel 
          session={currentSession} 
          isVisible={currentStep === 3 && currentSession !== null}
        />

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-zinc-800 text-center">
          <p className="text-xs text-zinc-600">
            Powered by CrewAI + GPT-5.2 Thinking • Sequential Process Architecture
          </p>
        </footer>
      </div>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
};

function App() {
  return (
    <div className="App dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
