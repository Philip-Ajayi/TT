import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "TT Laundry | Premium Fabric Care Ecosystem",
  description: "The Absolute Pinnacle of Fabric Reclamation & Luxury Care in Ibadan.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-canvas-light text-obsidian dark:bg-canvas-dark dark:text-alabaster antialiased overflow-x-hidden">
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
            <Navbar />
            <main>{children}</main>
            <Footer />
          </ThemeProvider>
      </body>
    </html>
  );
}
