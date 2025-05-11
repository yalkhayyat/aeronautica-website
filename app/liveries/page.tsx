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
import { Search, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { LiveryCard, LiveryCardSkeleton } from "@/components/livery_card";
import { useLiveries } from "@/hooks/useLiveries";
import { Livery } from "@/components/livery_card";
import aircraftTypes from "@/data/aircraft-types.json";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase-provider";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { EditLiveryModal } from "@/components/edit-livery-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LayoutGrid, LayoutList } from "lucide-react";

interface FilterAndSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearch: () => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  aircraftFilter: string | null;
  setAircraftFilter: (value: string) => void;
  availableAircraft: string[];
  activeTab: string;
  onTabChange: (value: string) => void;
  isUserSignedIn: boolean;
  pageSize: number;
  setPageSize: (size: number) => void;
  view: "grid" | "row";
  onViewChange: (view: "grid" | "row") => void;
}

interface LiveriesGridProps {
  liveries: (Livery & {
    isOwner?: boolean;
    onEdit?: (livery: Livery) => void;
    onDelete?: (id: number) => void;
  })[];
  view: "grid" | "row";
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-primary to-transparent">
      <div className="absolute inset-0">
        <Image
          src="/seyo_a320.png"
          alt="Airbus A330-300"
          layout="fill"
          objectFit="cover"
          className="opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Aircraft Liveries
        </h1>
        <p className="mt-6 max-w-3xl text-xl text-gray-300 leading-relaxed">
          Discover and download custom aircraft liveries for your favorite
          flight simulator. Browse through our extensive collection, save your
          favorites, and rate the ones you love.
        </p>
      </div>
    </section>
  );
}

function FilterAndSearchBar({
  searchQuery,
  setSearchQuery,
  handleSearch,
  sortBy,
  onSortChange,
  aircraftFilter,
  setAircraftFilter,
  availableAircraft,
  activeTab,
  onTabChange,
  isUserSignedIn,
  pageSize,
  setPageSize,
  view,
  onViewChange,
}: FilterAndSearchBarProps) {
  const [isAircraftPopoverOpen, setIsAircraftPopoverOpen] = useState(false);

  return (
    <section className="bg-card text-card-foreground py-6 border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          {isUserSignedIn ? (
            <Tabs
              defaultValue={activeTab}
              className="w-full lg:w-auto"
              onValueChange={onTabChange}
            >
              <TabsList className="w-full lg:w-auto">
                <TabsTrigger value="browse" className="flex-1 lg:flex-none">
                  Browse All
                </TabsTrigger>
                <TabsTrigger value="myLiveries" className="flex-1 lg:flex-none">
                  My Liveries
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex-1 lg:flex-none">
                  Saved Liveries
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <div />
          )}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1">
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
            <div className="flex gap-4">
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={view === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onViewChange("grid")}
                  className="rounded-none border-0"
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "row" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onViewChange("row")}
                  className="rounded-none border-0"
                  aria-label="Row view"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>

              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Newest first</SelectItem>
                  <SelectItem value="updated_at-desc">Last Updated</SelectItem>
                  <SelectItem value="likes-desc">Most Liked</SelectItem>
                  <SelectItem value="views-desc">Most Viewed</SelectItem>
                  <SelectItem value="title-asc">Alphabetical A to Z</SelectItem>
                  <SelectItem value="title-desc">
                    Alphabetical Z to A
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={pageSize.toString()}
                onValueChange={(value) => setPageSize(parseInt(value, 10))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="40">40 per page</SelectItem>
                  <SelectItem value="60">60 per page</SelectItem>
                </SelectContent>
              </Select>

              <Popover
                open={isAircraftPopoverOpen}
                onOpenChange={setIsAircraftPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isAircraftPopoverOpen}
                    className={cn(
                      "w-[180px] justify-between",
                      !aircraftFilter && "text-muted-foreground"
                    )}
                  >
                    {aircraftFilter || "Filter by Aircraft"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[180px] p-0">
                  <Command>
                    <CommandInput placeholder="Search aircraft..." />
                    <CommandList>
                      <CommandEmpty>No aircraft found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setAircraftFilter("all");
                            setIsAircraftPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !aircraftFilter ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Aircraft
                        </CommandItem>
                        {availableAircraft.map((aircraft) => (
                          <CommandItem
                            key={aircraft}
                            value={aircraft}
                            onSelect={(currentValue) => {
                              setAircraftFilter(currentValue);
                              setIsAircraftPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                aircraftFilter === aircraft
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {aircraft}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveriesGrid({ liveries, view }: LiveriesGridProps) {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`${
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col space-y-4"
          }`}
        >
          {liveries.map((livery) => (
            <LiveryCard
              key={livery.id}
              livery={livery}
              isOwner={livery.isOwner}
              onEdit={livery.onEdit}
              onDelete={livery.onDelete}
              view={view}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LoadingState({ view = "grid" }: { view?: "grid" | "row" }) {
  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`${
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "flex flex-col space-y-4"
          }`}
        >
          {[...Array(8)].map((_, i) => (
            <LiveryCardSkeleton key={i} view={view} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="p-8 max-w-md w-full text-center">
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Error Loading Liveries
        </h3>
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Card>
    </div>
  );
}

function EmptyState({
  message,
  buttonText,
  onClick,
}: {
  message: string;
  buttonText?: string;
  onClick?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Card className="p-8 max-w-md w-full text-center">
        <h3 className="text-lg font-semibold mb-2">No Liveries Found</h3>
        <p className="text-muted-foreground">{message}</p>
        {buttonText && onClick && (
          <Button variant="outline" className="mt-4" onClick={onClick}>
            {buttonText}
          </Button>
        )}
      </Card>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  // Function to generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];

    // Always include first page
    pageNumbers.push(1);

    // Calculate range around current page
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis after first page if there's a gap
    if (startPage > 2) {
      pageNumbers.push("ellipsis1");
    }

    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis before last page if there's a gap
    if (endPage < totalPages - 1) {
      pageNumbers.push("ellipsis2");
    }

    // Always include last page (if different from first page)
    if (totalPages > 1) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <div className="flex justify-center items-center space-x-2 mt-8 mb-12">
      {/* First page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="hidden sm:flex"
        aria-label="Go to first page"
      >
        <span className="sr-only">First</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06zm-6 0a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L5.832 10l3.938 3.71a.75.75 0 01.02 1.06z"
            clipRule="evenodd"
          />
        </svg>
      </Button>

      {/* Previous page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <span className="sr-only">Previous</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
            clipRule="evenodd"
          />
        </svg>
      </Button>

      {/* Page numbers */}
      <div className="hidden sm:flex items-center space-x-1">
        {getPageNumbers().map((page, index) => {
          if (page === "ellipsis1" || page === "ellipsis2") {
            return (
              <span
                key={`${page}-${index}`}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground"
              >
                …
              </span>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className="w-8 h-8 p-0"
              onClick={() => onPageChange(page as number)}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Mobile page indicator */}
      <div className="sm:hidden flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      {/* Next page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <span className="sr-only">Next</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
      </Button>

      {/* Last page button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="hidden sm:flex"
        aria-label="Go to last page"
      >
        <span className="sr-only">Last</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-4 h-4"
        >
          <path
            fillRule="evenodd"
            d="M4.21 14.77a.75.75 0 01.02-1.06L8.168 10 4.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02zm6 0a.75.75 0 01.02-1.06L14.168 10 10.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
      </Button>
    </div>
  );
}

export default function LiveriesPage() {
  const {
    liveries,
    loading,
    error,
    totalCount,
    page,
    setPage,
    pageSize,
    setPageSize: updatePageSize,
    sortBy,
    sortOrder,
    setSort,
    searchQuery,
    setSearchQuery,
    aircraftFilter,
    setAircraftFilter,
  } = useLiveries();

  const [activeTab, setActiveTab] = useState<string>("browse");
  const [userLiveries, setUserLiveries] = useState<Livery[]>([]);
  const [savedLiveries, setSavedLiveries] = useState<Livery[]>([]);
  const [isUserLiveriesLoading, setIsUserLiveriesLoading] =
    useState<boolean>(false);
  const [isSavedLiveriesLoading, setIsSavedLiveriesLoading] =
    useState<boolean>(false);
  const [userLiveriesError, setUserLiveriesError] = useState<string | null>(
    null
  );
  const [savedLiveriesError, setSavedLiveriesError] = useState<string | null>(
    null
  );
  const [view, setView] = useState<"grid" | "row">("grid");

  // Add state for editing and deleting
  const [liveryToEdit, setLiveryToEdit] = useState<Livery | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    liveryId: number | null;
  }>({
    open: false,
    liveryId: null,
  });

  const { user } = useUser();
  const supabase = useSupabase();
  const { toast } = useToast();
  const router = useRouter();

  // Always reset to browse tab for non-signed in users
  useEffect(() => {
    if (!user && activeTab !== "browse") {
      setActiveTab("browse");
    }
  }, [user, activeTab]);

  // Fetch user's liveries when the tab changes to "myLiveries"
  useEffect(() => {
    async function fetchUserLiveries() {
      if (!user) return;

      setIsUserLiveriesLoading(true);
      setUserLiveriesError(null);

      try {
        const { data, error } = await supabase
          .from("liveries")
          .select("*")
          .eq("user_id", user.id)
          .order(sortBy, { ascending: sortOrder === "asc" });

        if (error) throw error;
        setUserLiveries(data || []);
      } catch (error) {
        console.error("Error fetching user liveries:", error);
        setUserLiveriesError("Failed to load your liveries");
        toast({
          title: "Error",
          description: "Failed to load your liveries",
          variant: "destructive",
        });
      } finally {
        setIsUserLiveriesLoading(false);
      }
    }

    if (activeTab === "myLiveries" && user) {
      fetchUserLiveries();
    }
  }, [activeTab, user, supabase, sortBy, sortOrder, toast]);

  // Fetch saved liveries when the tab changes to "saved"
  useEffect(() => {
    async function fetchSavedLiveries() {
      if (!user) return;

      setIsSavedLiveriesLoading(true);
      setSavedLiveriesError(null);

      try {
        // Fetch the user's saved livery IDs directly from the users table
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("saves")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;

        // Check if the user has any saved liveries
        if (
          !userData ||
          !userData.saves ||
          !Array.isArray(userData.saves) ||
          userData.saves.length === 0
        ) {
          setSavedLiveries([]);
          setIsSavedLiveriesLoading(false);
          return;
        }

        // Fetch the actual liveries using the saved IDs
        const { data: liveriesData, error: liveriesError } = await supabase
          .from("liveries")
          .select("*")
          .in("id", userData.saves)
          .order(sortBy, { ascending: sortOrder === "asc" });

        if (liveriesError) throw liveriesError;

        setSavedLiveries(liveriesData || []);
      } catch (error) {
        console.error("Error fetching saved liveries:", error);
        setSavedLiveriesError("Failed to load your saved liveries");
        toast({
          title: "Error",
          description: "Failed to load your saved liveries",
          variant: "destructive",
        });
      } finally {
        setIsSavedLiveriesLoading(false);
      }
    }

    if (activeTab === "saved" && user) {
      fetchSavedLiveries();
    }
  }, [activeTab, user, supabase, sortBy, sortOrder, toast]);

  const handleTabChange = (value: string) => {
    // Prevent changing tab for non-signed in users
    if (!user && value !== "browse") {
      toast({
        title: "Sign in required",
        description: "Please sign in to view your liveries",
        variant: "destructive",
      });
      return;
    }
    setActiveTab(value);
  };

  const handleSearch = () => {
    setSearchQuery(searchQuery);
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split("-");
    setSort(newSortBy, newSortOrder as "asc" | "desc");
  };

  const handleAircraftFilterChange = (value: string) => {
    setAircraftFilter(value === "all" ? null : value);
  };

  // Edit functionality using modal
  const handleEditLivery = (livery: Livery) => {
    setLiveryToEdit(livery);
    setIsEditModalOpen(true);
  };

  // Update the livery after editing
  const handleLiveryUpdate = (updatedLivery: Livery) => {
    // Update userLiveries state
    setUserLiveries((prev) =>
      prev.map((livery) =>
        livery.id === updatedLivery.id ? updatedLivery : livery
      )
    );

    // Close the modal
    setIsEditModalOpen(false);
    setLiveryToEdit(null);

    // Show success message
    toast({
      title: "Success",
      description: "Livery updated successfully",
    });
  };

  // Delete confirmation dialog
  const confirmDelete = (id: number) => {
    setDeleteDialog({ open: true, liveryId: id });
  };

  // Delete functionality
  const handleDeleteLivery = async (id: number) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to delete a livery",
        variant: "destructive",
      });
      setDeleteDialog({ open: false, liveryId: null });
      return;
    }

    setIsDeleting(id);

    try {
      console.log(`Attempting to delete livery with ID: ${id}`);

      // Delete livery from database using numeric ID
      const { error } = await supabase.from("liveries").delete().eq("id", id);

      if (error) throw error;

      // Update local state to remove the deleted livery
      setUserLiveries((prev) => prev.filter((livery) => livery.id !== id));

      toast({
        title: "Success",
        description: "Livery deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting livery:", error);
      toast({
        title: "Error",
        description: "Failed to delete livery",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
      setDeleteDialog({ open: false, liveryId: null });
    }
  };

  // Determine which liveries to display based on active tab
  const getDisplayedLiveries = () => {
    switch (activeTab) {
      case "myLiveries":
        return userLiveries;
      case "saved":
        return savedLiveries;
      default:
        return liveries;
    }
  };

  // Determine loading state based on active tab
  const isLoading = () => {
    switch (activeTab) {
      case "myLiveries":
        return isUserLiveriesLoading;
      case "saved":
        return isSavedLiveriesLoading;
      default:
        return loading;
    }
  };

  // Determine error state based on active tab
  const getError = () => {
    switch (activeTab) {
      case "myLiveries":
        return userLiveriesError;
      case "saved":
        return savedLiveriesError;
      default:
        return error;
    }
  };

  // Rename function to avoid conflicts
  const handlePageSizeChange = (newSize: number) => {
    updatePageSize(newSize);
  };

  // View handling
  const handleViewChange = (newView: "grid" | "row") => {
    setView(newView);
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <HeroSection />
      <FilterAndSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        sortBy={`${sortBy}-${sortOrder}`}
        onSortChange={handleSortChange}
        aircraftFilter={aircraftFilter}
        setAircraftFilter={handleAircraftFilterChange}
        availableAircraft={aircraftTypes}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isUserSignedIn={!!user}
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        view={view}
        onViewChange={handleViewChange}
      />
      {isLoading() ? (
        <LoadingState view={view} />
      ) : getError() ? (
        <ErrorState error={getError() as string} />
      ) : getDisplayedLiveries().length === 0 ? (
        <EmptyState
          message={
            activeTab === "myLiveries"
              ? "You haven't created any liveries yet."
              : activeTab === "saved"
              ? "You haven't saved any liveries yet."
              : "No liveries found with the current filters."
          }
          buttonText={
            activeTab === "myLiveries"
              ? "Create Your First Livery"
              : activeTab === "saved"
              ? "Browse Liveries"
              : "Clear Filters"
          }
          onClick={
            activeTab === "myLiveries"
              ? () => router.push("/post")
              : activeTab === "saved"
              ? () => setActiveTab("browse")
              : () => {
                  setSearchQuery("");
                  setAircraftFilter(null);
                }
          }
        />
      ) : (
        <>
          <LiveriesGrid
            liveries={getDisplayedLiveries().map((livery) => ({
              ...livery,
              isOwner: activeTab === "myLiveries",
              onEdit: activeTab === "myLiveries" ? handleEditLivery : undefined,
              onDelete: activeTab === "myLiveries" ? confirmDelete : undefined,
            }))}
            view={view}
          />
          {activeTab === "browse" && (
            <Pagination
              currentPage={page}
              totalPages={Math.ceil(totalCount / pageSize)}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {/* Add the edit modal */}
      {liveryToEdit && (
        <EditLiveryModal
          livery={liveryToEdit}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setLiveryToEdit(null);
          }}
          onSave={handleLiveryUpdate}
        />
      )}

      {/* Add the delete dialog */}
      <AlertDialog open={deleteDialog.open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              livery and remove the data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.liveryId !== null &&
                handleDeleteLivery(deleteDialog.liveryId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
