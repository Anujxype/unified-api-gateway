import * as React from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fastx-theme");
      return (saved as Theme) || "dark";
    }
    return "dark";
  });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("fastx-theme", theme);
  }, [theme]);

  const toggleTheme = React.useCallback(() => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  }, []);

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, toggleTheme } },
    children
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
