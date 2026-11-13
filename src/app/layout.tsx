import type { Metadata, Viewport } from "next";
import "./globals.css";
import { DemoProvider } from "@/components/shared/DemoProvider";

export const metadata: Metadata = {
  title: "CARAWIN AI TUTOR — Your Personal AI Teacher",
  description: "Frontend prototype of CARAWIN AI TUTOR by Carawin Technologies. Demonstration data only.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#002147" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><DemoProvider>{children}</DemoProvider></body>
    </html>
  );
}
