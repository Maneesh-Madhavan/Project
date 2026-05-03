import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <Router>
    <App />
  </Router>
);
