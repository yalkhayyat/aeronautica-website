import "@/app/globals.css";

import NavBar from "@/components/navbar";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from "@/lib/supabase-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <SupabaseProvider>
        <html lang="en">
          <body>
            <NavBar />
            {children}
            <Toaster />
          </body>
        </html>
      </SupabaseProvider>
    </ClerkProvider>
  );
}
