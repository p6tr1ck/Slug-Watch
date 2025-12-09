import { createContext, useState, useEffect } from "react";

export const darkModeSwitch = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <darkModeSwitch.Provider value={{ theme, toggleTheme }}>
      {children}
    </darkModeSwitch.Provider>
  );
}
