"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronRight, Upload, Plane, Users, Share2 } from "lucide-react";
import Link from "next/link";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { RequireDiscordAuthButton } from "@/components/require-discord-auth-button";

export default function HomePage() {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);

    // Add autoplay functionality
    const autoplayInterval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000); // Change slide every 5 seconds

    return () => {
      clearInterval(autoplayInterval);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section with Split Layout */}
      <section className="relative min-h-[calc(100vh-4rem)]">
        {/* Background Image */}
        <div className="absolute inset-0 mx-4 my-4 rounded-3xl overflow-hidden">
          <Image
            src="/airport.png"
            alt="Airport"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />{" "}
          {/* Overlay for better text readability */}
        </div>

        {/* Content */}
        <div className="relative min-h-[calc(100vh-4rem)] flex items-end pb-20">
          <div className="container mx-auto px-4 flex justify-center">
            <div className="max-w-2xl text-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-xl text-white/90 leading-relaxed">
                    The central hub for everything Aeronautica. Discover
                    community-made liveries, share content, trade, and more.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    asChild
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/80"
                  >
                    <Link href="/liveries">
                      Explore Liveries <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <RequireDiscordAuthButton redirectUrl="/post">
                    <Button size="lg" variant="secondary">
                      <Upload className="mr-2 h-5 w-5" /> Post a Livery
                    </Button>
                  </RequireDiscordAuthButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Aerohub</h3>
              <p className="text-sm text-muted-foreground">
                The official platform for the Aeronautica community. Share,
                discover, and connect with fellow pilots.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Button variant="link" asChild className="text-sm font-medium text-muted-foreground hover:text-primary p-0">
                    <Link href="/liveries">
                      Browse Liveries
                    </Link>
                  </Button>
                </li>
                <li>
                  <RequireDiscordAuthButton redirectUrl="/post">
                    <Button variant="link" className="text-sm font-medium text-muted-foreground hover:text-primary p-0">
                      Upload Livery
                    </Button>
                  </RequireDiscordAuthButton>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8" />
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Aerohub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
