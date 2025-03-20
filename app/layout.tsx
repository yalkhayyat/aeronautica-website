import "@/app/globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SupabaseProvider } from "@/lib/supabase-provider";
import { Alexandria } from "next/font/google";
const alexandria = Alexandria({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          footer: "hidden",
        },
      }}
    >
      <SupabaseProvider>
        <html lang="en" className="bg-gray-100">
          <body className={alexandria.className}>
            {children}
            <Toaster />
          </body>
        </html>
      </SupabaseProvider>
    </ClerkProvider>
  );
}
