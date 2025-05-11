"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import useEmblaCarousel from "embla-carousel-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart,
  Star,
  Copy,
  CalendarIcon,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Livery } from "@/components/livery_card";
import { useSupabase } from "@/lib/supabase-provider";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { UserProfileCard } from "@/components/user-profile-card";

function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "m";
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  } else {
    return count.toString();
  }
}

export default function LiveryPage() {
  const [livery, setLivery] = useState<Livery | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [posterUserId, setPosterUserId] = useState("");
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const { user } = useUser();
  const { toast } = useToast();
  const params = useParams();
  const livery_id = Array.isArray(params.id) ? params.id[0] : params.id;
  const supabase = useSupabase();

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Setup Embla Carousel event handlers
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      // No need to update currentSlide or totalSlides here
    };

    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Fetch livery data
  useEffect(() => {
    async function fetchLiveryData() {
      try {
        const { data, error } = await supabase
          .from("liveries")
          .select("*")
          .eq("id", livery_id)
          .single();

        if (error) throw error;

        if (data) {
          setPosterUserId(data.user_id);
          setLivery(data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching livery:", error);
        toast({
          title: "Error",
          description: "Failed to load livery data",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }

    fetchLiveryData();
  }, [livery_id, supabase, toast]);

  // Check if the user has liked and saved this livery
  useEffect(() => {
    // Skip if no user or no livery
    if (!user?.id) return;

    async function checkUserInteractions() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("likes, saves")
          .eq("id", user!.id)
          .single();

        if (error || !data) return;

        // Check if this livery ID is in the user's likes array
        const numericLiveryId = parseInt(livery_id as string, 10);

        // Check likes
        const hasLiked =
          Array.isArray(data.likes) && data.likes.includes(numericLiveryId);
        setIsLiked(hasLiked);

        // Check saves
        const hasSaved =
          Array.isArray(data.saves) && data.saves.includes(numericLiveryId);
        setIsSaved(hasSaved);
      } catch (error) {
        console.error("Error checking user interactions:", error);
      }
    }

    checkUserInteractions();
  }, [user, livery_id, supabase]);

  // Handle like/unlike
  const handleLike = async () => {
    // Early returns for invalid states
    if (isLikeLoading || !user) {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to like this livery",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      // Start loading and optimistically update UI
      setIsLikeLoading(true);
      setIsLiked(!isLiked);

      // Call the RPC function to toggle like
      const { error } = await supabase.rpc("toggle_like_livery", {
        livery_id_input: parseInt(livery_id as string, 10),
      });

      if (error) throw error;

      // Update livery with fresh data
      const { data: updatedLivery } = await supabase
        .from("liveries")
        .select("likes")
        .eq("id", livery_id)
        .single();

      if (updatedLivery) {
        setLivery((prev) =>
          prev ? { ...prev, likes: updatedLivery.likes } : null
        );
      }
    } catch (error) {
      // Revert on error
      setIsLiked(isLiked);
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    } finally {
      setIsLikeLoading(false);
    }
  };

  // Handle save/unsave
  const handleSave = async () => {
    // Early returns for invalid states
    if (isSaveLoading || !user) {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save this livery",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      // Start loading and optimistically update UI
      setIsSaveLoading(true);
      setIsSaved(!isSaved);

      // Call the RPC function to toggle save
      const { error } = await supabase.rpc("toggle_save_livery", {
        livery_id_input: parseInt(livery_id as string, 10),
      });

      if (error) throw error;

      // Update livery with fresh data
      const { data: updatedLivery } = await supabase
        .from("liveries")
        .select("saves")
        .eq("id", livery_id)
        .single();

      if (updatedLivery) {
        setLivery((prev) =>
          prev ? { ...prev, saves: updatedLivery.saves } : null
        );
      }
    } catch (error) {
      // Revert on error
      setIsSaved(isSaved);
      console.error("Error toggling save:", error);
      toast({
        title: "Error",
        description: "Failed to update save status",
        variant: "destructive",
      });
    } finally {
      setIsSaveLoading(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${description} copied to clipboard`,
    });
  };

  if (isLoading) {
    return <LiveryPageSkeleton />;
  }

  if (!livery) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md animate-in fade-in duration-500">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-muted/50 p-4 mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-center mb-2">
              Livery not found
            </h2>
            <p className="text-muted-foreground text-center">
              The livery you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const createdDate = livery.created_at
    ? format(new Date(livery.created_at), "MMM d, yyyy")
    : "Unknown date";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {livery.title}
        </h1>
        <div className="flex items-center text-muted-foreground">
          <div className="flex items-center text-sm">
            <CalendarIcon className="h-4 w-4 mr-1.5" /> {createdDate}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Embla Carousel */}
          <Card className="overflow-hidden border-none bg-transparent shadow-none w-full">
            <div className="relative w-full">
              <div
                className="overflow-hidden w-[calc(100%+3rem)] -mx-6"
                ref={emblaRef}
              >
                <div className="flex">
                  {livery.images.map((image, index) => (
                    <div
                      key={index}
                      className="flex-[0_0_100%] flex items-center justify-center px-6"
                    >
                      <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm shadow-md w-full">
                        <div className="relative flex justify-center">
                          <Image
                            src={image}
                            alt={`${livery.title} - Image ${index + 1}`}
                            width={800}
                            height={600}
                            className="object-contain w-auto max-h-[80vh] mx-auto"
                            priority={index === 0}
                            style={{ display: "block" }}
                          />
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carousel Controls */}
              <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                <button
                  onClick={scrollPrev}
                  className="ml-3 bg-background/30 hover:bg-background/60 backdrop-blur-sm p-1.5 rounded-full transition-colors cursor-pointer shadow-sm z-10 pointer-events-auto focus:outline-none"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-4 w-4 text-foreground/70" />
                </button>
                <button
                  onClick={scrollNext}
                  className="mr-3 bg-background/30 hover:bg-background/60 backdrop-blur-sm p-1.5 rounded-full transition-colors cursor-pointer shadow-sm z-10 pointer-events-auto focus:outline-none"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-4 w-4 text-foreground/70" />
                </button>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">
                About this Livery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-card-foreground/80 leading-relaxed text-sm">
                {livery.description || "No description provided."}
              </p>

              <Separator className="my-6" />

              <h3 className="text-lg font-semibold mb-4">
                Vehicle Information
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                    Vehicle Name
                  </p>
                  <p className="text-sm">{livery.vehicle_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                    Vehicle Type
                  </p>
                  <p className="text-sm">{livery.vehicle_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* User Profile Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <UserProfileCard userId={posterUserId} />
            </CardContent>
          </Card>

          {/* Like/Save Actions */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex gap-4">
                {/* Like Button */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLike}
                  disabled={isLikeLoading}
                  className={`flex-1 transition-colors ${
                    isLiked ? "text-red-500 border-red-200 bg-red-50/50" : ""
                  }`}
                >
                  {isLikeLoading ? (
                    <div className="flex items-center">
                      <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                      {formatCount(livery.likes)}
                    </div>
                  ) : (
                    <>
                      <Heart
                        className={`h-5 w-5 mr-2 transition-all text-red-500 ${
                          isLiked ? "fill-red-500" : ""
                        }`}
                      />
                      {formatCount(livery.likes)}
                    </>
                  )}
                </Button>

                {/* Save Button */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSave}
                  disabled={isSaveLoading}
                  className={`flex-1 transition-colors ${
                    isSaved
                      ? "text-yellow-500 border-yellow-200 bg-yellow-50/50"
                      : ""
                  }`}
                >
                  {isSaveLoading ? (
                    <div className="flex items-center">
                      <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent" />
                      {formatCount(livery.saves)}
                    </div>
                  ) : (
                    <>
                      <Star
                        className={`h-5 w-5 mr-2 transition-all text-yellow-500 ${
                          isSaved ? "fill-yellow-500" : ""
                        }`}
                      />
                      {formatCount(livery.saves)}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Texture IDs */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">
                Texture IDs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {livery.texture_ids.map((texture, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-muted/50 p-3 rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {texture.name}
                      </p>
                      <p className="font-mono text-sm">{texture.id}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopy(texture.id, `${texture.name} ID`)
                      }
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Customization */}
          {livery.advanced_customization && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold">
                  Advanced Customization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted/50 p-4 rounded-lg text-xs overflow-x-auto font-mono text-card-foreground/80 max-h-60">
                  {JSON.stringify(livery.advanced_customization, null, 2)}
                </pre>
              </CardContent>
              <CardFooter className="pt-0 pb-4 px-4 sm:px-6">
                <Button
                  variant="secondary"
                  className="w-full text-sm"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(livery.advanced_customization),
                      "Advanced customization"
                    )
                  }
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Configuration
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveryPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
      {/* Header Section Skeleton */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Image Carousel Skeleton */}
          <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <Skeleton className="w-full h-[550px]" />
          </Card>

          {/* Description Skeleton */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <Skeleton className="h-7 w-40" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />

              <Separator className="my-6" />

              <Skeleton className="h-6 w-40 mb-4" />
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Profile Card Skeleton */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <Skeleton className="w-full h-72" />
          </Card>

          {/* Like/Save Actions Skeleton */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
              </div>
            </CardContent>
          </Card>

          {/* Texture IDs Skeleton */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((_, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-muted/50 p-3 rounded-lg"
                  >
                    <div>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Customization Skeleton */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full rounded-lg" />
            </CardContent>
            <CardFooter className="pt-0 pb-4 px-4 sm:px-6">
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
