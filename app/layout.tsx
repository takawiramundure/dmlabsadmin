import type { Metadata } from "next";
import "@/index.css";
import { ClientProviders } from "./ClientProviders";

export const metadata: Metadata = {
  title: "Admin Portal",
  description: "Centralized Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
