"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Wraps the whole studio UI in a `.studio-theme` element and flips its
// `data-theme` attribute, which swaps the CSS variables in globals.css. The
// choice is remembered across sessions.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem("agicards:theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  const toggle = () =>
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      localStorage.setItem("agicards:theme", next);
      return next;
    });

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div className="studio-theme" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
