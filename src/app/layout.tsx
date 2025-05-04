'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from './ThemeProvider';
import ThemeRegistry from './components/ThemeRegistry';
import { AuthProvider } from './context/AuthContext';
import RouteGuard from './RouteGuard';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ThemeRegistry>
            <RouteGuard>{children}</RouteGuard>
          </ThemeRegistry>
        </AuthProvider>
      </body>
    </html>
  );
}
