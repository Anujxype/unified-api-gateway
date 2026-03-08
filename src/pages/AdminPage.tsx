import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Key, FileText, Monitor, BarChart3, 
  LogOut, RefreshCw, Plus, Copy, Trash2, 
  Power, PowerOff, Search, Bell, Shield,
  Calendar, Globe, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FastXLogo } from "@/components/FastXLogo";
import { ShieldIcon } from "@/components/ShieldIcon";
import { GlassCard } from "@/components/GlassCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { adminAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { isExpiringSoon, isExpired, daysUntilExpiry } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TabId = "dashboard" | "keys" | "devices" | "logs" | "notifications";

interface ApiKey {
  id: string;
  key_name: string;
  key_value: string;
  status: "active" | "disabled";
  uses: number;
  created_at: string;
  expires_at: string | null;
  scope: string;
  allowed_ips: string[] | null;
}

interface Device {
  id: string;
  api_key_id: string;
  device_name: string | null;
  browser: string | null;
  os: string | null;
  screen_resolution: string | null;
  ip_address: string | null;
  location: string | null;
  status: "active" | "disabled";
  logins: number;
  last_active: string;
  key_name?: string;
  key_value?: string;
}

interface SearchLog {
  id: string;
  endpoint: string;
  query_param: string | null;
  response_status: number | null;
  created_at: string;
  key_name?: string;
}

interface LoginLog {
  id: string;
  key_name: string;
  key_value: string;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
}

const generateKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const SCOPES = [
  { value: "standard", label: "Standard" },
  { value: "read-only", label: "Read Only" },
  { value: "admin", label: "Admin" },
  { value: "limited", label: "Limited" },
];

const tabs = [
  { id: "dashboard" as TabId, name: "Dashboard", icon: BarChart3 },
  { id: "keys" as TabId, name: "Access Keys", icon: Key },
  { id: "devices" as TabId, name: "Devices", icon: Monitor },
  { id: "logs" as TabId, name: "Search Logs", icon: FileText },
  { id: "notifications" as TabId, name: "Notifications", icon: Bell },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>("keys");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("");
  const [newKeyScope, setNewKeyScope] = useState("standard");
  const [newKeyIps, setNewKeyIps] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<{ message: string; time: string; type: "login" | "expiry" }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminAuth.isAuthenticated()) {
      navigate("/admin-login");
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: keysData } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (keysData) setKeys(keysData as ApiKey[]);

      const { data: devicesData } = await supabase
        .from("devices")
        .select("*, api_keys(key_name, key_value)")
        .order("last_active", { ascending: false });
      
      if (devicesData) {
        setDevices(devicesData.map((d: any) => ({
          ...d,
          key_name: d.api_keys?.key_name,
          key_value: d.api_keys?.key_value,
        })));
      }

      const { data: logsData } = await supabase
        .from("search_logs")
        .select("*, api_keys(key_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (logsData) {
        setLogs(logsData.map((l: any) => ({
          ...l,
          key_name: l.api_keys?.key_name,
        })));
      }

      const { data: loginLogsData } = await supabase
        .from("login_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (loginLogsData) setLoginLogs(loginLogsData as LoginLog[]);

      // Check for expiring keys and build notifications
      if (keysData) {
        const expiryNotifs = (keysData as ApiKey[])
          .filter(k => k.expires_at && isExpiringSoon(k.expires_at))
          .map(k => ({
            message: `Key "${k.key_name}" expires in ${daysUntilExpiry(k.expires_at!)} day(s)`,
            time: new Date().toISOString(),
            type: "expiry" as const,
          }));
        setNotifications(prev => [...expiryNotifs, ...prev.filter(n => n.type === "login")]);
      }
    } catch (err) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime login notifications
  useEffect(() => {
    const channel = supabase
      .channel("login-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "login_logs" },
        (payload) => {
          const log = payload.new as LoginLog;
          toast.info(`🔔 ${log.key_name} just logged in!`, {
            description: format(new Date(log.created_at), "HH:mm:ss"),
            duration: 8000,
          });
          setLoginLogs(prev => [log, ...prev]);
          setNotifications(prev => [
            { message: `${log.key_name} logged in`, time: log.created_at, type: "login" },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    const keyValue = newKeyValue.trim() || generateKey();
    const ips = newKeyIps.trim() ? newKeyIps.split(",").map(ip => ip.trim()).filter(Boolean) : null;
    
    try {
      const insertData: any = {
        key_name: newKeyName.trim(),
        key_value: keyValue,
        scope: newKeyScope,
        allowed_ips: ips,
      };

      if (newKeyExpiry) {
        insertData.expires_at = new Date(newKeyExpiry).toISOString();
      }

      const { error } = await supabase.from("api_keys").insert(insertData);

      if (error) {
        if (error.code === "23505") {
          toast.error("This key value already exists");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Key created successfully");
      setNewKeyName("");
      setNewKeyValue("");
      setNewKeyExpiry("");
      setNewKeyScope("standard");
      setNewKeyIps("");
      fetchData();
    } catch (err) {
      toast.error("Failed to create key");
    }
  };

  const handleToggleKey = async (key: ApiKey) => {
    const newStatus = key.status === "active" ? "disabled" : "active";
    
    try {
      const { error } = await supabase
        .from("api_keys")
        .update({ status: newStatus })
        .eq("id", key.id);

      if (error) throw error;
      toast.success(`Key ${newStatus === "active" ? "enabled" : "disabled"}`);
      fetchData();
    } catch (err) {
      toast.error("Failed to update key");
    }
  };

  const handleDeleteKey = async (key: ApiKey) => {
    if (!confirm(`Delete key "${key.key_name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", key.id);
      if (error) throw error;
      toast.success("Key deleted");
      fetchData();
    } catch (err) {
      toast.error("Failed to delete key");
    }
  };

  const handleCopyKey = (keyValue: string) => {
    navigator.clipboard.writeText(keyValue);
    toast.success("Key copied to clipboard");
  };

  const handleLogout = () => {
    adminAuth.logout();
    toast.success("Logged out");
    navigate("/admin-login");
  };

  const filteredKeys = keys.filter(k => 
    k.key_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.key_value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter(l =>
    l.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.key_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalKeys: keys.length,
    activeKeys: keys.filter(k => k.status === "active").length,
    totalDevices: devices.length,
    totalSearches: keys.reduce((acc, k) => acc + k.uses, 0),
    expiringKeys: keys.filter(k => k.expires_at && isExpiringSoon(k.expires_at)).length,
    expiredKeys: keys.filter(k => k.expires_at && isExpired(k.expires_at)).length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-card rounded-none border-t-0 border-x-0 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldIcon variant="accent" size={28} checked />
            <h1 className="text-xl font-bold">Admin Control Center</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveTab("notifications")}
                className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <Bell size={18} />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={fetchData}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw size={18} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
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
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() => setActiveTab(tab.id)}
              className={`h-11 px-5 ${
                activeTab === tab.id 
                  ? "tab-active" 
                  : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              <tab.icon size={18} className="mr-2" />
              {tab.name}
              {tab.id === "notifications" && notifications.length > 0 && (
                <span className="ml-2 w-5 h-5 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 stagger-children">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Key size={24} className="text-primary" />
                  <span className="text-3xl font-bold">{stats.totalKeys}</span>
                </div>
                <p className="text-muted-foreground text-sm">Total Keys</p>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Power size={24} className="text-success" />
                  <span className="text-3xl font-bold">{stats.activeKeys}</span>
                </div>
                <p className="text-muted-foreground text-sm">Active Keys</p>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Monitor size={24} className="text-accent" />
                  <span className="text-3xl font-bold">{stats.totalDevices}</span>
                </div>
                <p className="text-muted-foreground text-sm">Devices</p>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Search size={24} className="text-primary" />
                  <span className="text-3xl font-bold">{stats.totalSearches}</span>
                </div>
                <p className="text-muted-foreground text-sm">Total Searches</p>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <AlertTriangle size={24} className="text-accent" />
                  <span className="text-3xl font-bold">{stats.expiringKeys}</span>
                </div>
                <p className="text-muted-foreground text-sm">Expiring Soon</p>
              </GlassCard>
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <PowerOff size={24} className="text-destructive" />
                  <span className="text-3xl font-bold">{stats.expiredKeys}</span>
                </div>
                <p className="text-muted-foreground text-sm">Expired</p>
              </GlassCard>
            </div>

            {/* Recent Logins */}
            <GlassCard>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell size={20} className="text-accent" />
                Recent Logins
              </h3>
              <div className="space-y-2">
                {loginLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                    <div>
                      <span className="font-medium">{log.key_name}</span>
                      <p className="text-xs text-muted-foreground">{log.device_info?.substring(0, 60) || "Unknown device"}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM HH:mm")}
                    </span>
                  </div>
                ))}
                {loginLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No login activity yet</p>
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Keys Tab */}
        {activeTab === "keys" && (
          <div className="space-y-6">
            {/* Create Key Form */}
            <GlassCard className="animate-fade-in">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus size={20} className="text-accent" />
                Create New Key
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Key Name</label>
                  <Input
                    placeholder="e.g., User Alpha"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus:border-accent input-glow h-12"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-2 block">Key Value (auto if empty)</label>
                    <Input
                      placeholder="Auto-generated"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      className="bg-secondary/50 border-border/50 focus:border-accent input-glow h-12 font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={() => setNewKeyValue(generateKey())} className="h-12 border-border/50">
                      <RefreshCw size={18} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                    <Calendar size={14} /> Expiration Date
                  </label>
                  <Input
                    type="date"
                    value={newKeyExpiry}
                    onChange={(e) => setNewKeyExpiry(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus:border-accent input-glow h-12"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                    <Shield size={14} /> Key Scope
                  </label>
                  <Select value={newKeyScope} onValueChange={setNewKeyScope}>
                    <SelectTrigger className="bg-secondary/50 border-border/50 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCOPES.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                    <Globe size={14} /> Allowed IPs (comma separated)
                  </label>
                  <Input
                    placeholder="e.g., 192.168.1.1, 10.0.0.1"
                    value={newKeyIps}
                    onChange={(e) => setNewKeyIps(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus:border-accent input-glow h-12 font-mono"
                  />
                </div>
              </div>

              <Button
                onClick={handleCreateKey}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold btn-glow glow-accent"
              >
                <Plus size={18} className="mr-2" />
                Create Key
              </Button>
            </GlassCard>

            {/* Keys List */}
            <GlassCard className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Key size={20} className="text-accent" />
                  All Keys ({filteredKeys.length})
                </h3>
                <Button variant="ghost" onClick={fetchData} disabled={loading}>
                  <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                {filteredKeys.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No keys found</p>
                ) : (
                  filteredKeys.map((key) => {
                    const expired = key.expires_at ? isExpired(key.expires_at) : false;
                    const expiringSoon = key.expires_at ? isExpiringSoon(key.expires_at) : false;

                    return (
                      <div 
                        key={key.id}
                        className={`bg-secondary/30 rounded-lg p-4 flex flex-col gap-3 animate-slide-in ${
                          expired ? "border border-destructive/30" : expiringSoon ? "border border-accent/30" : ""
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold">{key.key_name}</h4>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">{key.scope}</span>
                              {expired && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">Expired</span>
                              )}
                              {expiringSoon && !expired && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent flex items-center gap-1">
                                  <AlertTriangle size={10} />
                                  Expires in {daysUntilExpiry(key.expires_at!)}d
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-mono text-primary">{key.key_value}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                              <span>Created: {format(new Date(key.created_at), "dd/MM/yyyy")}</span>
                              <span>Uses: {key.uses}</span>
                              {key.expires_at && (
                                <span>Expires: {format(new Date(key.expires_at), "dd/MM/yyyy")}</span>
                              )}
                              {key.allowed_ips && key.allowed_ips.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Globe size={10} /> {key.allowed_ips.join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              key.status === "active" 
                                ? "bg-success/20 text-success" 
                                : "bg-destructive/20 text-destructive"
                            }`}>
                              {key.status === "active" ? "Active" : "Disabled"}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => handleCopyKey(key.key_value)} className="h-9 w-9">
                              <Copy size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleKey(key)}
                              className={`h-9 w-9 ${key.status === "active" ? "text-success" : "text-muted-foreground"}`}
                            >
                              {key.status === "active" ? <Power size={16} /> : <PowerOff size={16} />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteKey(key)}
                              className="h-9 w-9 text-destructive hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === "devices" && (
          <GlassCard className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Monitor size={20} className="text-accent" />
                All Devices ({devices.length})
              </h3>
              <Button variant="ghost" onClick={fetchData} disabled={loading}>
                <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Device</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Key</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Location</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">IP Address</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Logins</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No devices found</td></tr>
                  ) : (
                    devices.map((device) => (
                      <tr key={device.id} className="border-b border-border/30 hover:bg-secondary/30">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{device.browser || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{device.os} • {device.screen_resolution}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-secondary px-2 py-1 rounded text-sm font-mono">{device.key_name || "Unknown"}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{device.location || "Unknown"}</td>
                        <td className="py-3 px-4 font-mono text-sm">{device.ip_address || "Unknown"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            device.status === "active" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          }`}>
                            {device.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">{device.logins}</td>
                        <td className="py-3 px-4 text-muted-foreground text-sm">
                          {format(new Date(device.last_active), "dd/MM/yyyy, HH:mm:ss")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Logs Tab */}
        {activeTab === "logs" && (
          <GlassCard className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText size={20} className="text-accent" />
                Search Logs ({logs.length})
              </h3>
              <Button variant="ghost" onClick={fetchData} disabled={loading}>
                <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            <div className="mb-4">
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-secondary/50 border-border/50 focus:border-primary input-glow max-w-md"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Time</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Key</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Endpoint</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Query</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No logs found</td></tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border/30 hover:bg-secondary/30">
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "dd/MM/yyyy, HH:mm:ss")}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-secondary px-2 py-1 rounded text-sm">{log.key_name || "Unknown"}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-primary">{log.endpoint}</td>
                        <td className="py-3 px-4 font-mono text-sm">{log.query_param || "-"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            log.response_status === 200 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                          }`}>
                            {log.response_status || "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="space-y-6 animate-fade-in">
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bell size={20} className="text-accent" />
                  Notifications ({notifications.length})
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setNotifications([])}>
                  Clear All
                </Button>
              </div>

              <div className="space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No notifications</p>
                ) : (
                  notifications.map((notif, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
                      notif.type === "expiry" ? "bg-accent/10 border border-accent/20" : "bg-primary/10 border border-primary/20"
                    }`}>
                      {notif.type === "expiry" ? (
                        <AlertTriangle size={18} className="text-accent shrink-0" />
                      ) : (
                        <Bell size={18} className="text-primary shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notif.time), "dd/MM/yyyy HH:mm")}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        notif.type === "expiry" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                      }`}>
                        {notif.type === "expiry" ? "Expiry Warning" : "Login"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* Login Activity */}
            <GlassCard>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Key size={20} className="text-primary" />
                Login Activity
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Time</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Key Name</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginLogs.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No login activity</td></tr>
                    ) : (
                      loginLogs.map((log) => (
                        <tr key={log.id} className="border-b border-border/30 hover:bg-secondary/30">
                          <td className="py-3 px-4 text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM/yyyy, HH:mm:ss")}
                          </td>
                          <td className="py-3 px-4 font-medium">{log.key_name}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground truncate max-w-xs">
                            {log.device_info?.substring(0, 80) || "Unknown"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
}
