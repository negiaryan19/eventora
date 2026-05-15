import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { SnackbarProvider } from "notistack";

import {
  ThemeProvider,
  CssBaseline,
} from "@mui/material";

import theme from "./theme/theme";

import {
  PaymentProvider,
} from "./context/PaymentContext";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <SnackbarProvider maxSnack={3}>
        <PaymentProvider>
          <App />
        </PaymentProvider>
      </SnackbarProvider>
    </ThemeProvider>
  </React.StrictMode>
);