"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { SiteProvider } from "@/context/SiteContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ANALYTICS_CONFIG } from "@/config/analyticsConfig";
import { DialogProvider } from "@/context/DialogContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={ANALYTICS_CONFIG.CLIENT_ID}>
      <ThemeProvider>
        <AuthProvider>
          <SiteProvider>
            <DialogProvider>
              <AnalyticsProvider>{children}</AnalyticsProvider>
            </DialogProvider>
          </SiteProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
