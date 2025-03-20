"use client";

import Card from "@/components/card";
import { useToast } from "@/hooks/use-toast";
import { useSupabase } from "@/lib/supabase-provider";
import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";

export default function HomePage() {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>();

  useEffect(() => {
    const fetchLiveries = async () => {
      let { data, error } = await supabase
        .from("liveries")
        .select("vehicle_name,title,likes,views,created_at,images,id")
        .order("likes", { ascending: false })
        .limit(100);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch featured liveries",
          variant: "destructive",
        });
      }

      if (data) {
        // Sort the posts using the custom scoring algorithm
        const sortedPosts = data.map((post) => {
          const timeSinceCreationInDays = Math.floor(
            (Date.now() - new Date(post.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // Calculate the score based on likes and views
          const score =
            (post.likes * 2 + post.views) * (1 / (timeSinceCreationInDays + 1));

          return {
            ...post,
            score,
          };
        });

        // Sort posts based on the calculated score (higher score = higher priority)
        sortedPosts?.sort((a, b) => b.score - a.score);

        // Update the state with sorted posts
        setPosts(sortedPosts.slice(0, 6));
      }
    };

    fetchLiveries();
  });

  return (
    <div>
      <div className="m-8">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-3xl">Featured</div>
            <div className="opacity-60">
              Check out some of Aeronautica's most popular liveries
            </div>
          </div>
          <Link href={"/liveries"}>View All</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">
          {posts?.map((post) => (
            <Card
              key={post.id}
              title={post.title}
              likes={post.likes}
              views={post.views}
              img={post.images[0]}
              tag={post.vehicle_name}
            />
          ))}
        </div>
      </div>

      <div className="m-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 grid-rows-9 gap-2 mt-8 h-[1600px] lg:h-[800px]">
          <div className="relative row-span-4">
            <Image
              className="object-cover rounded-xl"
              src={"/aurora.jpg"}
              fill
              alt="Plan your perfect flight"
            ></Image>
            <div className="flex flex-col h-full justify-between absolute">
              <div className="m-8">
                <div className="text-3xl text-white">
                  Plan your perfect flight
                </div>
                <div className="text-white opacity-60">
                  Browse through thousands of community-made liveries
                </div>
              </div>
              <Button
                className="h-12 m-8 w-48 bg-white"
                variant={"secondary"}
                asChild
              >
                <Link href={"/liveries"}>
                  Liveries
                  <ArrowUpRight className="ml-2 " />
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative row-span-9">
            <Image
              className="object-cover rounded-xl"
              src={"/epic_a380.png"}
              fill
              alt="Plan your perfect flight"
            ></Image>
          </div>
          <div className="relative row-span-5">
            <Image
              className="object-cover rounded-xl"
              src={"/liveries.jpg"}
              fill
              alt="Plan your perfect flight"
            ></Image>
          </div>
        </div>
      </div>
    </div>
  );
}
