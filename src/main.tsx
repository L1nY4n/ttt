import React from "react";
import ReactDOM from "react-dom/client";
import {  BrowserRouter } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip";

import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
 <BrowserRouter>
 <TooltipProvider delayDuration={0}>
    <App />
    </TooltipProvider>
    <Toaster />
    </BrowserRouter>
  </React.StrictMode>,
);
