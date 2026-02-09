import { Shield, ShieldCheck } from "lucide-react";

interface ShieldIconProps {
  variant?: "primary" | "accent";
  size?: number;
  checked?: boolean;
  className?: string;
}

export function ShieldIcon({ 
  variant = "primary", 
  size = 48, 
  checked = false,
  className = "" 
}: ShieldIconProps) {
  const Icon = checked ? ShieldCheck : Shield;
  const colorClass = variant === "primary" ? "text-primary" : "text-accent";
  
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div 
        className={`absolute inset-0 rounded-2xl ${
          variant === "primary" 
            ? "bg-primary/20" 
            : "bg-accent/20"
        }`}
        style={{ 
          width: size * 1.5, 
          height: size * 1.5,
          transform: "translate(-25%, -25%)"
        }}
      />
      <Icon 
        size={size} 
        className={`${colorClass} shield-pulse relative z-10`}
        strokeWidth={1.5}
      />
    </div>
  );
}
