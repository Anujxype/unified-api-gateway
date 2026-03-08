import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

type Theme = "dark" | "light";

let currentTheme: Theme = (typeof window !== "undefined" && localStorage.getItem("fastx-theme") as Theme) || "dark";
const listeners = new Set<() => void>();

function getTheme(): Theme {
  return currentTheme;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setThemeGlobal(theme: Theme) {
  currentTheme = theme;
  localStorage.setItem("fastx-theme", theme);
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  listeners.forEach(l => l());
}

// Initialize on load
if (typeof window !== "undefined") {
  document.documentElement.classList.add(currentTheme);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
  
  const toggleTheme = useCallback(() => {
    setThemeGlobal(theme === "dark" ? "light" : "dark");
  }, [theme]);

  return { theme, toggleTheme };
}
