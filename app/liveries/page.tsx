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

interface Livery {
  id: number;
  name: string;
  creator: string;
  saved: number;
  rating: number;
  image: string;
  isSaved: boolean;
}

const initialLiveries: Livery[] = [
  {
    id: 1,
    name: "AeroGenesis A330-300 - MEXICANA 1.0",
    creator: "MELL",
    saved: 11,
    rating: 4.5,
    image: "/home_plane.png",
    isSaved: false,
  },
  {
    id: 2,
    name: "EVA Air Laminar A330-300 Livery Three-Pack 1.0",
    creator: "DEADBYDAYLIGHT",
    saved: 188,
    rating: 4.8,
    image: "/home_plane.png",
    isSaved: false,
  },
  {
    id: 3,
    name: "X-Works A339neo Mexican Air Force 1.0",
    creator: "MELL",
    saved: 36,
    rating: 4.2,
    image: "/home_plane.png",
    isSaved: false,
  },
  {
    id: 4,
    name: "Air France A340-313 F-GLZP X-Works A340-300 - White and Black Radom",
    creator: "AIRFRANCE_KLM",
    saved: 42,
    rating: 4.7,
    image: "/home_plane.png",
    isSaved: false,
  },
];

export default function LiveriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [liveries, setLiveries] = useState<Livery[]>(initialLiveries);

  const toggleSave = (id: number) => {
    setLiveries((prevLiveries) =>
      prevLiveries.map((livery) =>
        livery.id === id
          ? {
              ...livery,
              isSaved: !livery.isSaved,
              saved: livery.isSaved ? livery.saved - 1 : livery.saved + 1,
            }
          : livery
      )
    );
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <HeroSection />
      <FilterAndSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />
      <LiveriesGrid liveries={liveries} toggleSave={toggleSave} />
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
  toggleSave: (id: number) => void;
}

function LiveriesGrid({ liveries, toggleSave }: LiveriesGridProps) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {liveries.map((livery) => (
            <LiveryCard
              key={livery.id}
              livery={livery}
              onToggleSave={toggleSave}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
