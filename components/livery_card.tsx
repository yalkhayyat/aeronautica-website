import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, User, Eye } from "lucide-react";

export interface Livery {
  id: number;
  created_at: string;
  user_id: string;
  title: string;
  description: string;
  aircraft: string;
  advanced_customization: {};
  texture_ids: [{ id: string; name: string }];
  views: number;
  likes: number;
  images: [string];
}

interface LiveryCardProps {
  livery: Livery;
}

export function LiveryCard({ livery }: LiveryCardProps) {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsername() {
      try {
        const response = await fetch(`/api/get-user?userId=${livery.user_id}`);
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
  }, [livery.user_id]);

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
    <Link href={`/livery/${livery.id}`} passHref>
      <Card className="overflow-hidden cursor-pointer transition-shadow hover:shadow-lg">
        <div className="relative">
          <Image
            src={livery.images[0]}
            alt={livery.title}
            width={600}
            height={400}
            className="w-full h-48 object-cover"
          />
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
            {livery.aircraft}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2">{livery.title}</h3>
          <p className="text-sm text-muted-foreground mt-1 flex items-center">
            <User className="h-4 w-4 mr-1" />
            {username || "Loading..."}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground flex items-center">
              <Heart className="h-4 w-4 mr-1 fill-red-400 text-red-400" />
              {formatNumber(livery.likes)}
            </span>
            <span className="text-sm text-muted-foreground flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {formatNumber(livery.views)}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              window.open(`/livery/${livery.id}`, "_blank");
            }}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
