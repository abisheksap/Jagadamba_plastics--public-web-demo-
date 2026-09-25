import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./catalog.css";
import "./public-motion.css";
import "./theme-ideas.css";
import "./arranger.css";
import "./process-journey.css";
import "./message-action.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
