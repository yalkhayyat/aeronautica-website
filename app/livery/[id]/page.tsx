"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Heart, Copy, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Livery } from "@/components/livery_card";

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
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useClerk();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchLivery() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/livery/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch livery");
        }
        const data = await response.json();
        setLivery(data);
        // Increment view count
        await fetch(`/api/livery/${id}/view`, { method: "POST" });
      } catch (err) {
        setError("Error loading livery. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) {
      fetchLivery();
    }
  }, [id]);

  useEffect(() => {
    if (livery) {
      async function fetchUsername() {
        try {
          const response = await fetch(`/api/user/${livery.user_id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }
          const userData = await response.json();
          setUsername(userData.username);
        } catch (error) {
          console.error("Error fetching username:", error);
          setUsername("Unknown User");
        }
      }
      fetchUsername();
    }
  }, [livery]);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like this livery.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`/api/livery/${id}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update like status");
      }
      const data = await response.json();
      setLivery((prev) => (prev ? { ...prev, likes: data.likes } : null));
      setIsLiked(!isLiked);
      toast({
        title: "Success",
        description: "Livery like status updated successfully!",
        variant: "default",
      });
    } catch (err) {
      console.error("Error updating livery like status:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to update like status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${description} has been copied to your clipboard.`,
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!livery) return <div>Livery not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{livery.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Carousel className="w-full max-w-xs mx-auto">
            <CarouselContent>
              {livery.images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Image
                      src={image}
                      alt={`Livery image ${index + 1}`}
                      width={400}
                      height={300}
                      className="rounded-lg"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={handleLike}
              variant={isLiked ? "default" : "outline"}
            >
              <Heart
                className={`mr-2 h-4 w-4 ${isLiked ? "fill-current" : ""}`}
              />
              {formatCount(livery.likes)}
            </Button>
            <div className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              {formatCount(livery.views)}
            </div>
          </div>
        </div>
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">Details</h2>
              <p className="mb-2">
                <strong>Aircraft:</strong> {livery.aircraft}
              </p>
              <p className="mb-2">
                <strong>Description:</strong> {livery.description}
              </p>
              <p className="mb-2">
                <strong>Creator:</strong> {username || "Loading..."}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(livery.user_id, "User ID")}
                  className="ml-2"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </p>
              <p className="mb-2">
                <strong>Created:</strong>{" "}
                {new Date(livery.created_at).toLocaleDateString()}
              </p>
              <div className="mb-2">
                <strong>Texture IDs:</strong>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {livery.texture_ids.map((texture, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {texture.name}: {texture.id}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <strong>Advanced Customization:</strong>
                <pre className="bg-muted p-2 rounded-md mt-1 text-xs overflow-x-auto">
                  {JSON.stringify(livery.advanced_customization, null, 2)}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopy(
                      JSON.stringify(livery.advanced_customization),
                      "Advanced customization"
                    )
                  }
                  className="mt-2"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
