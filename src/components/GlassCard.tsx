import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  active?: boolean;
  onClick?: () => void;
}

export function GlassCard({ 
  children, 
  className = "", 
  hover = false,
  active = false,
  onClick 
}: GlassCardProps) {
  return (
    <div 
      className={cn(
        "glass-card p-6",
        hover && "endpoint-card",
        active && "active",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
