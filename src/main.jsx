import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SettingsProvider } from "./context/SettingsContext";
import { BoxesProvider }    from "./components/layout/BoxesContent";
import { ToastProvider }    from "./context/ToastContext";
import { ReadingsProvider } from "./context/ReadingsContext";
import { SerialProvider }   from "./context/SerialContext";
import { AuthProvider }     from "./context/AuthContext";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <BoxesProvider>
              <ReadingsProvider>
                <SerialProvider>
                  <App />
                </SerialProvider>
              </ReadingsProvider>
            </BoxesProvider>
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);