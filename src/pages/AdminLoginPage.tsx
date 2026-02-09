import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldIcon } from "@/components/ShieldIcon";
import { GlassCard } from "@/components/GlassCard";
import { adminAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      toast.error("Please enter the admin password");
      return;
    }

    setLoading(true);
    
    // Simulate delay for security
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (adminAuth.login(password)) {
      toast.success("Welcome to Admin Panel");
      navigate("/admin");
    } else {
      toast.error("Invalid admin password");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Back Link */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Portal
      </Link>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Shield Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-2xl bg-accent/10 float">
            <ShieldIcon variant="accent" size={56} checked />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Restricted Access</p>
        </div>

        {/* Login Card */}
        <GlassCard className="animate-scale-in">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Lock size={16} className="text-accent" />
                Admin Password
              </label>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary/50 border-border/50 focus:border-accent input-glow h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold btn-glow glow-accent"
            >
              <ShieldCheck size={18} className="mr-2" />
              {loading ? "Authenticating..." : "Access Admin Panel"}
            </Button>
          </form>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          Administrative access is logged and monitored
        </p>
      </div>
    </div>
  );
}
