import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Key, Power, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FastXLogo } from "@/components/FastXLogo";
import { ShieldIcon } from "@/components/ShieldIcon";
import { GlassCard } from "@/components/GlassCard";
import { supabase } from "@/integrations/supabase/client";
import { userAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function LoginPage() {
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      toast.error("Please enter your access key");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("key_value", accessKey.trim())
        .single();

      if (error || !data) {
        toast.error("Invalid access key");
        return;
      }

      if (data.status === "disabled") {
        toast.error("This key has been disabled");
        return;
      }

      // Log device info
      const deviceInfo = {
        api_key_id: data.id,
        device_name: navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop",
        browser: navigator.userAgent.split(" ").pop()?.split("/")[0] || "Unknown",
        os: navigator.platform,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        ip_address: "Fetching...",
        location: "Unknown",
      };

      await supabase.from("devices").upsert(deviceInfo, { onConflict: "api_key_id" });
      
      // Increment usage
      await supabase.rpc("increment_key_usage", { key_val: accessKey.trim() });

      userAuth.login(accessKey.trim(), data.key_name);
      toast.success(`Welcome, ${data.key_name}!`);
      navigate("/portal");
    } catch (err) {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Shield Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-2xl bg-primary/10 float">
            <ShieldIcon variant="primary" size={56} />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Fast<span className="text-primary">X</span> Portal
          </h1>
          <p className="text-muted-foreground">Secure Access Gateway</p>
        </div>

        {/* Login Card */}
        <GlassCard className="animate-scale-in">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Key size={16} className="text-primary" />
                Access Key
              </label>
              <Input
                type="text"
                placeholder="Enter your access key"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                className="bg-secondary/50 border-border/50 focus:border-primary input-glow h-12 font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold btn-glow glow-primary"
            >
              <Power size={18} className="mr-2" />
              {loading ? "Connecting..." : "Access Portal"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/50" />
              </div>
            </div>

            <Link
              to="/admin-login"
              className="block text-center text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin Access
            </Link>
          </form>
        </GlassCard>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          Protected by FastX Security Protocol
        </p>
      </div>
    </div>
  );
}
