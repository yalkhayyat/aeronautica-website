import "@/app/globals.css";

import NavBar from "@/components/navbar";
import Home from "@/components/home";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <NavBar />
          <Home />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
