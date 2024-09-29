"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search, Plane } from "lucide-react";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isSignedIn } = useUser();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Plane className="h-6 w-6 text-primary mr-2" />
              <span className="text-2xl font-bold text-foreground hidden sm:inline">
                Aeronautica
              </span>
            </Link>
          </div>
          <div className="flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search liveries..."
                  className="w-full pl-10 pr-4 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              </div>
            </form>
          </div>
          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                <Link href="/post">
                  <Button variant="secondary" className="flex items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Post Livery</span>
                  </Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost">Log In</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="default">Sign Up</Button>
                </SignUpButton>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
