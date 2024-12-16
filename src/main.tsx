import React from "react";
import ReactDOM from "react-dom/client";

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
 <TooltipProvider delayDuration={0}>
    <App />
    </TooltipProvider>
    <Toaster />
  </React.StrictMode>,
);
