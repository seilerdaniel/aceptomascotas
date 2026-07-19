import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { HelmetProvider } from "react-helmet-async";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { initGA } from "./lib/analytics";
import { ThemeProvider } from "./components/theme-provider";

initGA();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <App />
        <Analytics />
        <SpeedInsights />
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
);