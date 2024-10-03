"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
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
import { Heart, Bookmark, Copy, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Livery } from "@/components/livery_card";
import { useSupabase } from "@/lib/supabase-provider";
import { useUser } from "@clerk/nextjs";

function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "m";
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + "k";
  } else {
    return count.toString();
  }
}

interface UserData {
  username: string;
  image_url: string;
  likes: [number];
  saves: [number];
}

export default function LiveryPage() {
  const [livery, setLivery] = useState<Livery | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [posterUserId, setPosterUserId] = useState("");
  const [posterUserName, setPosterUserName] = useState("");
  const [posterUserImage, setPosterUserImage] = useState("");
  const { isSignedIn, user } = useUser();
  const [userData, setUserData] = useState<UserData | null>(null);
  const { toast } = useToast();
  const params = useParams();
  const livery_id = Array.isArray(params.id) ? params.id[0] : params.id;

  const supabase = useSupabase();

  // Get post data
  useEffect(() => {
    async function fetchPostData() {
      try {
        const { data, error } = await supabase
          .from("liveries")
          .select(
            "id,user_id,likes,saves,created_at,title,description,images,advanced_customization,views,updated_at,vehicle_name,vehicle_type,texture_ids"
          )
          .eq("id", livery_id)
          .single();

        if (error) throw error;

        if (data) {
          setPosterUserId(data.user_id);
          setLivery(data);
        }
      } catch (error) {
        console.error("Error fetching user_id:", error);
        toast({
          title: "Server Error",
          description: "Faiiled to fetch livery data",
          variant: "destructive",
        });
      }
    }

    fetchPostData();
  }, [livery_id, supabase, toast]);

  // Get livery poster user data
  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("username,image_url")
          .eq("id", posterUserId)
          .single();

        if (error) throw error;

        if (data) {
          setPosterUserName(data.username);
          setPosterUserImage(data.image_url);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Internal Server Error",
          description: "Faiiled to fetch user data",
          variant: "destructive",
        });
      }
    }

    if (posterUserId != "") {
      fetchUserData();
    }
  }, [posterUserId, toast, supabase]);

  // Fetch signed in user data
  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("username,image_url,likes,saves")
          .eq("id", user?.id)
          .single();

        if (error) throw error;

        if (data) {
          setUserData(data);
          setIsLiked(data.likes.includes(Number(livery_id)) || false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast({
          title: "Internal Server Error",
          description: "Faiiled to fetch user data",
          variant: "destructive",
        });
      }
    }

    if (posterUserId != "") {
      fetchUserData();
    }
  }, [posterUserId, toast, supabase, user, livery_id]);

  const handleLike = async () => {
    const { error } = await supabase.rpc("toggle_like_livery", {
      livery_id_input: Number(livery_id),
    });

    if (error) {
      toast({
        title: "Server Error",
        description: "Failed to like/unlike the image. Please try again.",
        variant: "destructive",
      });
    }

    setLivery((prevLivery) => {
      if (!prevLivery) return prevLivery; // Handle null case

      return {
        ...prevLivery,
        likes: isLiked ? prevLivery.likes - 1 : prevLivery.likes + 1,
      };
    });
    setIsLiked(!isLiked);
  };

  const handleSave = async () => {
    // TODO: Implement save functionality
    setIsSaved(!isSaved);
  };

  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${description} has been copied to your clipboard.`,
    });
  };

  if (isLoading) {
    return null;
  }

  if (!livery) {
    return <div>Livery not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Carousel className="w-full max-w-3xl mx-auto">
            <CarouselContent>
              {livery.images.map((image, index) => (
                <CarouselItem key={index}>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="p-1"
                  >
                    <Image
                      src={image}
                      alt={`Livery image ${index + 1}`}
                      width={600}
                      height={400}
                      className="rounded-lg object-cover w-full h-[400px]"
                    />
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-600">{livery.description}</p>
          </motion.div>
        </div>
        <div>
          <Card className="w-full">
            <CardContent className="p-6">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold mb-4"
              >
                {livery.title}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center mb-4"
              >
                <Image
                  src={posterUserImage}
                  alt={posterUserName}
                  width={40}
                  height={40}
                  className="rounded-full mr-2"
                />
                <span className="font-semibold">{posterUserName}</span>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex justify-between items-center mb-6"
              >
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className="flex items-center space-x-1"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isLiked ? "fill-red-500 text-red-500" : ""
                      }`}
                    />
                    <span>{formatCount(livery.likes)}</span>
                  </Button>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-5 w-5" />
                    <span>{formatCount(livery.views)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="flex items-center space-x-1"
                >
                  <Bookmark
                    className={`h-5 w-5 ${
                      isSaved ? "fill-yellow-500 text-yellow-500" : ""
                    }`}
                  />
                  <span>{formatCount(livery.saves)}</span>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <h2 className="text-xl font-semibold mb-2">Texture IDs</h2>
                {livery.texture_ids.map((texture, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <Badge variant="secondary" className="text-xs">
                      {texture.name}: {texture.id}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleCopy(texture.id, `${texture.name} ID`)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <h2 className="text-xl font-semibold mb-2">
                  Advanced Customization
                </h2>
                {livery.advanced_customization ? (
                  <>
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
                  </>
                ) : (
                  <p className="text-sm text-gray-500">
                    No advanced customization available
                  </p>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
