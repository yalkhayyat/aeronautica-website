import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, Upload } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen font-sans">
      {/* Hero Section with Background Image */}
      <section className="relative">
        <div className="absolute inset-0">
          <Image
            src="/home_plane.png"
            alt="a plane"
            layout="fill"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative bg-background/80 backdrop-blur-md rounded-3xl shadow-2xl">
            <div className="relative z-10 px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl md:text-6xl">
                  Elevate Your Aeronautica Experience
                </h1>
                <p className="mt-6 text-xl text-primary/90">
                  The central hub for everything Aeronautica. Discover
                  community-made liveries, share content, trade, and more.
                </p>
                <div className="mt-5">
                  <Button
                    size="lg"
                    className="bg-background text-primary hover:bg-foreground hover:text-secondary"
                  >
                    Explore Liveries <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-4xl font-bold">Share Your Creations</h2>
          <p className="mb-8 text-xl text-primary-foreground/90">
            Join our community of aviation enthusiasts and showcase your custom
            liveries
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="secondary" size="lg">
              <Upload className="mr-2 h-5 w-5" /> Upload Livery
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Aeronautica. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
