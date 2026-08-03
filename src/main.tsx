import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "@/components/theme-provider.tsx";
import { SettingsProvider } from "@/lib/settings.tsx";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="typerreflex-theme">
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ThemeProvider>
  </StrictMode>
);
