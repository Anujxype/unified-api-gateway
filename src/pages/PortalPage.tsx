import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FastXLogo } from "@/components/FastXLogo";
import { GlassCard } from "@/components/GlassCard";
import { API_ENDPOINTS, API_BASE_URL, EndpointId } from "@/lib/constants";
import { userAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PortalPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointId>("mobile");
  const [queryValue, setQueryValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();
  const session = userAuth.getSession();

  useEffect(() => {
    if (!userAuth.isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const currentEndpoint = API_ENDPOINTS.find(e => e.id === selectedEndpoint)!;

  const handleSearch = async () => {
    if (!queryValue.trim()) {
      toast.error(`Please enter ${currentEndpoint.placeholder.toLowerCase()}`);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const url = `${API_BASE_URL}${currentEndpoint.path}?${currentEndpoint.param}=${encodeURIComponent(queryValue.trim())}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      setResult(data);

      // Log the search
      if (session) {
        const { data: keyData } = await supabase
          .from("api_keys")
          .select("id")
          .eq("key_value", session.keyValue)
          .single();

        if (keyData) {
          await supabase.from("search_logs").insert({
            api_key_id: keyData.id,
            endpoint: currentEndpoint.path,
            query_param: queryValue.trim(),
            response_status: response.status,
          });
        }
      }

      toast.success("Search completed");
    } catch (err) {
      toast.error("Failed to fetch data");
      setResult({ error: "Failed to fetch data from API" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    userAuth.logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-card rounded-none border-t-0 border-x-0 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <FastXLogo size="md" />
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User size={18} />
              <span className="hidden sm:inline">{session?.keyName || "User"}</span>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Endpoint Selection */}
        <div className="mb-8">
          <h2 className="text-muted-foreground mb-4">Select Endpoint</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
            {API_ENDPOINTS.map((endpoint) => (
              <GlassCard
                key={endpoint.id}
                hover
                active={selectedEndpoint === endpoint.id}
                onClick={() => {
                  setSelectedEndpoint(endpoint.id);
                  setResult(null);
                  setQueryValue("");
                }}
                className="p-4"
              >
                <h3 className={`font-semibold ${selectedEndpoint === endpoint.id ? "text-primary" : "text-foreground"}`}>
                  {endpoint.name}
                </h3>
                <p className="text-sm text-muted-foreground font-mono mt-1">
                  {endpoint.path}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Search Section */}
        <GlassCard className="mb-8 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Search size={20} className="text-primary" />
            <h2 className="text-xl font-semibold">{currentEndpoint.name}</h2>
          </div>
          <p className="text-muted-foreground mb-4">{currentEndpoint.description}</p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              type="text"
              placeholder={currentEndpoint.placeholder}
              value={queryValue}
              onChange={(e) => setQueryValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 bg-secondary/50 border-border/50 focus:border-primary input-glow h-12 font-mono"
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold btn-glow glow-primary"
            >
              <Search size={18} className="mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground mt-4 font-mono">
            <span className="text-primary">GET</span> {currentEndpoint.path}?{currentEndpoint.param}=
            <span className="text-accent">{"{"}{currentEndpoint.param}{"}"}</span>
          </p>
        </GlassCard>

        {/* Results */}
        {result && (
          <GlassCard className="animate-scale-in">
            <h3 className="text-lg font-semibold mb-4">Response</h3>
            <pre className="bg-secondary/50 rounded-lg p-4 overflow-auto max-h-96 text-sm font-mono text-foreground/90">
              {JSON.stringify(result, null, 2)}
            </pre>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
