import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth, formatApiErrorDetail } from "@/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";

const AuthLayout = ({ title, subtitle, children }) => (
  <div className="min-h-screen bg-background-1 text-foreground-1 flex flex-col">
    <nav className="p-4 md:p-6">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-1 hover:text-foreground-1 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back to home</span>
      </Link>
    </nav>
    <div className="flex-1 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 justify-center mb-8">
          <motion.div className="p-2 rounded-lg bg-primary/20" whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
            <Zap className="w-6 h-6 text-primary" />
          </motion.div>
          <span className="text-2xl font-bold">MARS</span>
        </div>
        <Card className="bg-surface-1 border-border-1">
          <CardHeader>
            <CardTitle className="text-2xl">{title}</CardTitle>
            {subtitle && <p className="text-sm text-muted-1">{subtitle}</p>}
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </motion.div>
    </div>
  </div>
);

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your MARS account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-1" />
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="pl-9 bg-surface-2 border-border-1"
              disabled={loading} data-testid="input-email" />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-1" />
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="pl-9 bg-surface-2 border-border-1"
              disabled={loading} data-testid="input-password" />
          </div>
        </div>
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-md" data-testid="error-msg">{error}</div>}
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading} data-testid="btn-submit">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
        </Button>
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline" data-testid="link-forgot">
            Forgot password?
          </Link>
          <Link to="/register" className="text-muted-1 hover:text-foreground-1" data-testid="link-register">
            Create account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start researching with AI agents in seconds">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <div className="relative mt-1">
            <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-1" />
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Jane Researcher" className="pl-9 bg-surface-2 border-border-1"
              disabled={loading} data-testid="input-name" />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-1" />
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="pl-9 bg-surface-2 border-border-1"
              disabled={loading} data-testid="input-email" />
          </div>
        </div>
        <div>
          <Label htmlFor="password">Password (min 8 characters)</Label>
          <div className="relative mt-1">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-1" />
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="pl-9 bg-surface-2 border-border-1"
              disabled={loading} data-testid="input-password" minLength={8} />
          </div>
        </div>
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-md" data-testid="error-msg">{error}</div>}
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading} data-testid="btn-submit">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create Account"}
        </Button>
        <div className="text-sm text-center">
          <span className="text-muted-1">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline" data-testid="link-login">Sign in</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent you a password reset link">
        <div className="text-center py-4" data-testid="forgot-success">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <p className="text-muted-1 mb-6">
            If an account exists for <strong className="text-foreground-1">{email}</strong>, we've sent a password reset link. The link expires in 1 hour.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">Back to login</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a reset link">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="relative mt-1">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-1" />
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" className="pl-9 bg-surface-2 border-border-1"
              disabled={loading} data-testid="input-email" />
          </div>
        </div>
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-md">{error}</div>}
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading} data-testid="btn-submit">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send Reset Link"}
        </Button>
        <div className="text-sm text-center">
          <Link to="/login" className="text-muted-1 hover:text-foreground-1">Back to login</Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Password reset! Please sign in.");
      navigate("/login");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid reset link" subtitle="Missing or invalid token">
        <Link to="/forgot-password">
          <Button className="w-full">Request new link</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Enter a new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">New Password</Label>
          <div className="relative mt-1">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-1" />
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="pl-9 bg-surface-2 border-border-1"
              disabled={loading} data-testid="input-password" minLength={8} />
          </div>
        </div>
        <div>
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative mt-1">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-1" />
            <Input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••" className="pl-9 bg-surface-2 border-border-1"
              disabled={loading} data-testid="input-confirm" />
          </div>
        </div>
        {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 p-3 rounded-md">{error}</div>}
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading} data-testid="btn-submit">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</> : "Reset Password"}
        </Button>
      </form>
    </AuthLayout>
  );
};
