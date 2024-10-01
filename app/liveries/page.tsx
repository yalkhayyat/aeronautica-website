"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { LiveryCard } from "@/components/livery_card";
import { useLiveries } from "@/hooks/useLiveries";

interface Livery {
  id: number;
  created_at: string;
  user_id: string;
  title: string;
  likes: number;
  image: string;
}

export default function LiveriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const { liveries } = useLiveries();
  // console.log("liveries");
  // console.log(liveries);

  return (
    <div className="min-h-screen bg-background font-sans">
      <HeroSection />
      <FilterAndSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <LiveriesGrid liveries={liveries} />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative bg-gray-900">
      <div className="absolute inset-0">
        <Image
          src="/home_plane.png"
          alt="Airbus A330-300"
          layout="fill"
          objectFit="cover"
          className="opacity-40"
        />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Liveries
        </h1>
        <p className="mt-6 max-w-3xl text-xl text-gray-300">
          You are currently browsing through Liveries. In this category you will
          find aircraft liveries and paint-kits that you can use in-game. Use
          the bookmark feature to add a livery to your Saved list. Make sure to
          rate a livery after viewing it!
        </p>
      </div>
    </section>
  );
}

interface FilterAndSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

function FilterAndSearchBar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
}: FilterAndSearchBarProps) {
  return (
    <section className="bg-card text-card-foreground py-4 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <Tabs defaultValue="browse" className="w-full sm:w-auto">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="browse" className="flex-1 sm:flex-none">
                Browse
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex-1 sm:flex-none">
                Saved
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative flex-grow sm:flex-grow-0">
              <Input
                type="search"
                placeholder="Search liveries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="most-saved">Most Saved</SelectItem>
                <SelectItem value="top-rated">Top Rated</SelectItem>
                <SelectItem value="a-z">Alphabetical A to Z</SelectItem>
                <SelectItem value="z-a">Alphabetical Z to A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </section>
  );
}

interface LiveriesGridProps {
  liveries: Livery[];
}

function LiveriesGrid({ liveries }: LiveriesGridProps) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {liveries.map((livery) => (
            <LiveryCard key={livery.id} livery={livery} />
          ))}
        </div>
      </div>
    </section>
  );
}
