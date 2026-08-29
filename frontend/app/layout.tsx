import type { Metadata } from "next";
import "./globals.css";
import ThemeInit from "@/components/ThemeInit";
import ScrollProgress from "@/components/ScrollProgress";
import Navbar from "@/components/Navbar";
import LoadingOverlayProvider from "@/components/LoadingOverlay";
import { apiJson } from "@/lib/api";
import type { UserOut } from "@/lib/types";

export const metadata: Metadata = {
  title: "RAVEN — Orientation-Aware Object Detection",
  description: "Detection that never blinks. Aerial object detection with YOLOv8-OBB.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await apiJson<UserOut>("/auth/me");

  return (
    <html lang="en">
      <body className="page-fade">
        <ThemeInit />
        <ScrollProgress />
        <Navbar userEmail={user?.email ?? null} />
        <LoadingOverlayProvider>{children}</LoadingOverlayProvider>
      </body>
    </html>
  );
}
