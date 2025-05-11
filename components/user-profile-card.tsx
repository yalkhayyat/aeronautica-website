"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, Heart, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfileCardProps {
  userId: string;
}

interface UserStats {
  user: {
    username: string;
    image_url: string;
    banner_url?: string | null;
  };
  stats: {
    liveries: number;
    likes: number;
    saves: number;
  };
}

export function UserProfileCard({ userId }: UserProfileCardProps) {
  const [userData, setUserData] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUserStats() {
      console.log("Fetching user stats for ID:", userId);
      try {
        if (!userId) {
          throw new Error("No user ID provided");
        }

        const response = await fetch(`/api/users/${userId}/stats`);
        const responseText = await response.text();

        console.log("API response status:", response.status);
        console.log("API response body:", responseText);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${responseText}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(`Failed to parse response: ${responseText}`);
        }

        // Handle successful response
        setUserData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching user stats:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        toast({
          title: "Error",
          description: `Failed to load user profile data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (userId) {
      fetchUserStats();
    }
  }, [userId, toast]);

  if (isLoading) {
    return <UserProfileCardSkeleton />;
  }

  if (error || !userData) {
    return (
      <Card className="max-w-md mx-auto overflow-hidden animate-in fade-in duration-500">
        <CardContent className="p-6 text-center">
          <div className="text-red-400 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2">
              Failed to load profile
            </h3>
            <p className="text-sm text-muted-foreground">
              {error || "Could not load user data"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { user, stats } = userData;

  // Create a fallback user in case data is incomplete
  const displayUser = {
    username: user?.username || "Unknown User",
    image_url: user?.image_url || "",
  };

  const displayStats = {
    liveries: stats?.liveries || 0,
    likes: stats?.likes || 0,
    saves: stats?.saves || 0,
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    } else {
      return num.toString();
    }
  };

  return (
    <Card className="max-w-md mx-auto overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 animate-in fade-in duration-500">
      {/* Banner */}
      <div className="h-24 relative bg-gradient-to-b from-primary/80 to-primary/100" />

      <CardContent className="p-6 pt-12 relative">
        {/* Profile Picture */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden flex items-center justify-center bg-primary/0">
            {displayUser.image_url ? (
              <Image
                src={displayUser.image_url}
                alt={displayUser.username}
                width={96}
                height={96}
                className="object-cover h-full w-full"
              />
            ) : (
              <User className="h-12 w-12 text-primary" />
            )}
          </div>
        </div>

        {/* Username */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold">{displayUser.username}</h2>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-2xl font-bold">
              {formatNumber(displayStats.liveries)}
            </p>
            <p className="text-sm text-muted-foreground">Uploads</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-center items-center gap-1">
              <Heart className="h-4 w-4 fill-red-400 text-red-400" />
              <p className="text-2xl font-bold">
                {formatNumber(displayStats.likes)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Likes</p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-center items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <p className="text-2xl font-bold">
                {formatNumber(displayStats.saves)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Favorites</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UserProfileCardSkeleton() {
  return (
    <Card className="max-w-md mx-auto overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 animate-pulse animate-in fade-in duration-500">
      {/* Banner Skeleton */}
      <div className="h-24 w-full bg-muted" />

      <CardContent className="p-6 pt-12 relative">
        {/* Profile Picture Skeleton */}
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
          <Skeleton className="h-24 w-24 rounded-full bg-muted" />
        </div>

        {/* Username Skeleton */}
        <div className="text-center mb-6">
          <Skeleton className="h-6 w-32 mx-auto" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-8 w-16 mx-auto" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
