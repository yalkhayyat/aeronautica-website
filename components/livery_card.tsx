import { useState, useEffect, MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, User, Star, Edit, Trash2, Loader2 } from "lucide-react";
import { useSupabase } from "@/lib/supabase-provider";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";

export interface Livery {
  id: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  title: string;
  description: string;
  vehicle_name: string;
  vehicle_type: string;
  advanced_customization: Record<string, unknown>;
  texture_ids: [{ id: string; name: string }];
  views: number;
  likes: number;
  saves: number;
  images: [string];
}

interface LiveryCardProps {
  livery: Livery;
  isOwner?: boolean;
  onEdit?: (livery: Livery) => void;
  onDelete?: (id: number) => void;
  view?: "grid" | "row";
}

export function LiveryCard({
  livery,
  isOwner = false,
  onEdit,
  onDelete,
  view = "grid",
}: LiveryCardProps) {
  const [username, setUsername] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [localLikes, setLocalLikes] = useState<number>(livery.likes);
  const [localSaves, setLocalSaves] = useState<number>(livery.saves);
  const [isLikeLoading, setIsLikeLoading] = useState<boolean>(false);
  const [isSaveLoading, setIsSaveLoading] = useState<boolean>(false);

  const supabase = useSupabase();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsername() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("username")
          .eq("id", livery.user_id)
          .single();

        if (error) {
          console.error("Error fetching username:", error);
          setUsername("Unknown User");
          return;
        }

        setUsername(data?.username || "Unknown User");
      } catch (error) {
        console.error("Error fetching username:", error);
        setUsername("Unknown User");
      }
    }

    fetchUsername();
  }, [livery.user_id, supabase]);

  // Check if user has liked or saved this livery
  useEffect(() => {
    async function checkUserInteractions() {
      if (!user) return;

      try {
        // Get user data with likes and saves
        const { data, error } = await supabase
          .from("users")
          .select("likes, saves")
          .eq("id", user.id)
          .single();

        if (error || !data) return;

        // Check likes
        const hasLiked =
          Array.isArray(data.likes) && data.likes.includes(livery.id);
        setIsLiked(hasLiked);

        // Check saves
        const hasSaved =
          Array.isArray(data.saves) && data.saves.includes(livery.id);
        setIsSaved(hasSaved);
      } catch (err) {
        console.log("Error checking user interactions:", err);
      }
    }

    checkUserInteractions();
  }, [user, livery.id, supabase]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    } else {
      return num.toString();
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();

    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInYears > 0) {
      return `${diffInYears} ${diffInYears === 1 ? "year" : "years"} ago`;
    } else if (diffInMonths > 0) {
      return `${diffInMonths} ${diffInMonths === 1 ? "month" : "months"} ago`;
    } else if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    } else {
      return `${diffInMinutes} ${
        diffInMinutes === 1 ? "minute" : "minutes"
      } ago`;
    }
  };

  const handleTagClick = (e: MouseEvent<HTMLSpanElement>) => {
    e.preventDefault(); // Prevent the parent Link from activating
    e.stopPropagation(); // Prevent event bubbling
    router.push(
      `/liveries?aircraft=${encodeURIComponent(livery.vehicle_name)}`
    );
  };

  const handleEditClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent bubbling
    if (onEdit) onEdit(livery);
  };

  const handleDeleteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent bubbling
    if (onDelete) onDelete(livery.id);
  };

  const handleLikeClick = async (e: MouseEvent<HTMLSpanElement>) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent bubbling

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like liveries",
        variant: "destructive",
      });
      return;
    }

    if (isLikeLoading) return;

    try {
      // Start loading and optimistically update UI
      setIsLikeLoading(true);
      setIsLiked(!isLiked);
      setLocalLikes((prev) => (isLiked ? prev - 1 : prev + 1));

      // Call the RPC function to toggle like
      const { error } = await supabase.rpc("toggle_like_livery", {
        livery_id_input: livery.id,
      });

      if (error) throw error;

      // Update livery with fresh data
      const { data: updatedLivery } = await supabase
        .from("liveries")
        .select("likes")
        .eq("id", livery.id)
        .single();

      if (updatedLivery) {
        setLocalLikes(updatedLivery.likes);
      }
    } catch (error) {
      // Revert changes on error
      setIsLiked(!isLiked);
      setLocalLikes((prev) => (isLiked ? prev + 1 : prev - 1));

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

  const handleSaveClick = async (e: MouseEvent<HTMLSpanElement>) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Prevent bubbling

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save liveries",
        variant: "destructive",
      });
      return;
    }

    if (isSaveLoading) return;

    setIsSaveLoading(true);

    try {
      // Optimistically update UI
      setIsSaved(!isSaved);
      setLocalSaves((prev) => (isSaved ? prev - 1 : prev + 1));

      // Call the RPC function to toggle save
      const { error } = await supabase.rpc("toggle_save_livery", {
        livery_id_input: livery.id,
      });

      if (error) throw error;

      // Update livery with fresh data
      const { data: updatedLivery } = await supabase
        .from("liveries")
        .select("saves")
        .eq("id", livery.id)
        .single();

      if (updatedLivery) {
        setLocalSaves(updatedLivery.saves);
      }
    } catch (error) {
      // Revert changes on error
      setIsSaved(!isSaved);
      setLocalSaves((prev) => (isSaved ? prev + 1 : prev - 1));

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

  // Render grid view (original card layout)
  if (view === "grid") {
    return (
      <Link href={`/livery/${livery.id}`} passHref>
        <Card className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50 group animate-in fade-in duration-500">
          <div className="relative overflow-hidden">
            <Image
              src={livery.images[0]}
              alt={livery.title}
              width={600}
              height={400}
              className="w-full h-52 object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            />
            {isOwner && (
              <div className="absolute right-2 top-2 flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-background/80 hover:bg-background"
                  onClick={handleEditClick}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-background/80 hover:bg-destructive/20 text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <CardContent className="p-4 flex-grow flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <span
                  className={`text-sm flex items-center ${
                    isLiked
                      ? "text-red-400"
                      : "text-muted-foreground hover:text-red-400"
                  } transition-colors cursor-pointer p-1`}
                  onClick={handleLikeClick}
                >
                  {isLikeLoading ? (
                    <Loader2 className="h-5 w-5 mr-1.5 animate-spin" />
                  ) : (
                    <Heart
                      className={`h-5 w-5 mr-1.5 ${
                        isLiked ? "fill-red-400 text-red-400" : "text-red-400"
                      }`}
                    />
                  )}
                  {formatNumber(localLikes)}
                </span>
                <span
                  className={`text-sm flex items-center ${
                    isSaved
                      ? "text-yellow-400"
                      : "text-muted-foreground hover:text-yellow-400"
                  } transition-colors cursor-pointer p-1`}
                  onClick={handleSaveClick}
                >
                  {isSaveLoading ? (
                    <Loader2 className="h-5 w-5 mr-1.5 animate-spin" />
                  ) : (
                    <Star
                      className={`h-5 w-5 mr-1.5 ${
                        isSaved
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-yellow-400"
                      }`}
                    />
                  )}
                  {formatNumber(localSaves)}
                </span>
              </div>
              <span
                className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium transition-colors hover:bg-primary/30 cursor-pointer"
                onClick={handleTagClick}
              >
                #
                {livery.vehicle_name.length > 15
                  ? `${livery.vehicle_name.substring(0, 16)}...`
                  : livery.vehicle_name}
              </span>
            </div>
            <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
              {livery.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2 flex-grow">
              {livery.description || "No description provided."}
            </p>
            <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
              <p className="text-xs text-muted-foreground flex items-center hover:text-primary transition-colors">
                <User className="h-3.5 w-3.5 mr-1 text-primary/70" />
                {username || "Loading..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(livery.created_at)}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Render row view (condensed layout)
  return (
    <Link href={`/livery/${livery.id}`} passHref>
      <Card className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:bg-card/70 h-full w-full flex flex-row bg-card/50 backdrop-blur-sm border-border/50 group animate-in fade-in duration-500">
        <div className="relative overflow-hidden h-[90px] min-w-[135px] w-[135px]">
          <Image
            src={livery.images[0]}
            alt={livery.title}
            width={135}
            height={90}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        </div>
        <CardContent className="p-2 sm:p-3 flex-grow flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div className="flex flex-col">
              <h3 className="font-semibold text-base sm:text-lg line-clamp-1 hover:text-primary transition-colors">
                {livery.title}
              </h3>

              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium transition-colors hover:bg-primary/30 cursor-pointer shrink-0"
                  onClick={handleTagClick}
                >
                  #{/* Mobile: 20 chars, Desktop: 75 chars */}
                  <span className="hidden md:inline">
                    {livery.vehicle_name.length > 75
                      ? `${livery.vehicle_name.substring(0, 75)}...`
                      : livery.vehicle_name}
                  </span>
                  <span className="inline md:hidden">
                    {livery.vehicle_name.length > 20
                      ? `${livery.vehicle_name.substring(0, 20)}...`
                      : livery.vehicle_name}
                  </span>
                </span>

                <p className="text-xs text-muted-foreground line-clamp-1">
                  {livery.description || "No description provided."}
                </p>
              </div>
            </div>

            {isOwner && (
              <div className="flex gap-1 mt-0.5 sm:mt-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 bg-background/80 hover:bg-background"
                  onClick={handleEditClick}
                >
                  <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 sm:h-7 sm:w-7 bg-background/80 hover:bg-destructive/20 text-destructive"
                  onClick={handleDeleteClick}
                >
                  <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-1 sm:mt-0">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground flex items-center hover:text-primary transition-colors">
                <User className="h-3 w-3 mr-1 text-primary/70" />
                {username || "Loading..."}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(livery.created_at)}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span
                className={`text-xs flex items-center ${
                  isLiked
                    ? "text-red-400"
                    : "text-muted-foreground hover:text-red-400"
                } transition-colors cursor-pointer p-1`}
                onClick={handleLikeClick}
              >
                {isLikeLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Heart
                    className={`h-4 w-4 mr-1 ${
                      isLiked ? "fill-red-400 text-red-400" : "text-red-400"
                    }`}
                  />
                )}
                {formatNumber(localLikes)}
              </span>
              <span
                className={`text-xs flex items-center ${
                  isSaved
                    ? "text-yellow-400"
                    : "text-muted-foreground hover:text-yellow-400"
                } transition-colors cursor-pointer p-1`}
                onClick={handleSaveClick}
              >
                {isSaveLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Star
                    className={`h-4 w-4 mr-1 ${
                      isSaved
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-yellow-400"
                    }`}
                  />
                )}
                {formatNumber(localSaves)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function LiveryCardSkeleton({
  view = "grid",
}: {
  view?: "grid" | "row";
}) {
  if (view === "grid") {
    return (
      <Card className="overflow-hidden h-full flex flex-col bg-card/50 backdrop-blur-sm border-border/50 animate-pulse animate-in fade-in duration-500">
        <div className="relative overflow-hidden">
          <div className="w-full h-52 bg-muted" />
        </div>
        <CardContent className="p-4 flex-grow flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="h-4 w-16 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
            <div className="h-5 w-24 bg-muted rounded-full" />
          </div>
          <div className="h-6 w-3/4 bg-muted rounded mb-2" />
          <div className="space-y-2 mt-1 flex-grow">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-2/3 bg-muted rounded" />
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 flex justify-between items-center">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Row skeleton
  return (
    <Card className="overflow-hidden w-full flex flex-row bg-card/50 backdrop-blur-sm border-border/50 animate-pulse animate-in fade-in duration-500">
      <div className="relative overflow-hidden h-[90px] min-w-[135px] w-[135px]">
        <div className="w-full h-full bg-muted" />
      </div>
      <CardContent className="p-2 sm:p-3 flex-grow flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:justify-between">
          <div className="space-y-1.5 sm:w-2/3">
            <div className="h-4 sm:h-5 w-3/4 bg-muted rounded" />
            <div className="h-3.5 w-full bg-muted rounded" />
          </div>
          <div className="hidden sm:block h-5 w-20 bg-muted rounded-full mt-1" />
        </div>

        <div className="flex justify-between items-center mt-1.5">
          <div className="flex items-center space-x-2">
            <div className="h-3.5 w-20 bg-muted rounded" />
            <div className="h-3.5 w-16 bg-muted rounded" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-3.5 w-12 bg-muted rounded" />
            <div className="h-3.5 w-12 bg-muted rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
