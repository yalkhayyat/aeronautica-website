"use client";

import { useState, useEffect } from "react";
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
import { Livery } from "@/components/livery_card";
import aircraftTypes from "@/data/aircraft-types.json";

export default function LiveriesPage() {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const {
    liveries,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    searchQuery,
    setSearchQuery,
    aircraftFilter,
    setAircraftFilter,
  } = useLiveries();

  const handleSearch = () => {
    setSearchQuery(localSearchQuery);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-");
    setSortBy(newSortBy);
    setSortOrder(newSortOrder as "asc" | "desc");
    setPage(1);
  };

  const handleAircraftFilterChange = (value: string) => {
    setAircraftFilter(value === "all" ? null : value);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <HeroSection />
      <FilterAndSearchBar
        searchQuery={localSearchQuery}
        setSearchQuery={setLocalSearchQuery}
        handleSearch={handleSearch}
        sortBy={`${sortBy}-${sortOrder}`}
        setSortBy={handleSortChange}
        aircraftFilter={aircraftFilter}
        setAircraftFilter={handleAircraftFilterChange}
        availableAircraft={aircraftTypes}
      />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <p>Error: {error}</p>
        </div>
      ) : (
        <>
          <LiveriesGrid liveries={liveries} />
          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / pageSize)}
            onPageChange={handlePageChange}
          />
        </>
      )}
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
  handleSearch: () => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  aircraftFilter: string | null;
  setAircraftFilter: (aircraft: string | null) => void;
  availableAircraft: string[];
}

function FilterAndSearchBar({
  searchQuery,
  setSearchQuery,
  handleSearch,
  sortBy,
  setSortBy,
  aircraftFilter,
  setAircraftFilter,
  availableAircraft,
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
            <div className="relative grow sm:grow-0">
              <Input
                type="search"
                placeholder="Search liveries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest first</SelectItem>
                <SelectItem value="updated_at-desc">Last Updated</SelectItem>
                <SelectItem value="likes-desc">Most Liked</SelectItem>
                <SelectItem value="views-desc">Most Viewed</SelectItem>
                <SelectItem value="title-asc">Alphabetical A to Z</SelectItem>
                <SelectItem value="title-desc">Alphabetical Z to A</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={aircraftFilter || "all"}
              onValueChange={(value) =>
                setAircraftFilter(value === "all" ? null : value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Aircraft" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Aircraft</SelectItem>
                {availableAircraft.map((aircraft) => (
                  <SelectItem key={aircraft} value={aircraft}>
                    {aircraft}
                  </SelectItem>
                ))}
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

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  return (
    <div className="flex justify-center items-center space-x-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 border rounded-md"
      >
        Previous
      </button>
      <span>{`Page ${currentPage} of ${totalPages}`}</span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border rounded-md"
      >
        Next
      </button>
    </div>
  );
}
