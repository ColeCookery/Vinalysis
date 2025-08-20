import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { AlbumCard } from "@/components/album-card";
import { AlbumDetailModal } from "@/components/album-detail-modal";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Edit, Trash2 } from "lucide-react";
import type { AlbumWithRating, RatingWithAlbum } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AlbumWithRating[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithRating | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("rating-desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's ratings
  const { data: userRatings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ["/api/ratings"],
  });

  // Get user stats
  const { data: userStats } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Search mutation
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/search?q=${encodeURIComponent(query)}`);
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Search Error",
        description: "Failed to search albums. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Quick rating mutation for search results
  const quickRatingMutation = useMutation({
    mutationFn: async ({ albumId, rating }: { albumId: string; rating: number }) => {
      return await apiRequest("POST", "/api/ratings", {
        albumId,
        rating: rating.toString(),
        listened: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Rating saved successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save rating",
        variant: "destructive",
      });
    },
  });

  // Delete rating mutation
  const deleteRatingMutation = useMutation({
    mutationFn: async (ratingId: string) => {
      return await apiRequest("DELETE", `/api/ratings/${ratingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Rating deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete rating",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchMutation.mutate(query.trim());
    } else {
      setSearchResults([]);
    }
  };

  const handleAlbumClick = async (album: AlbumWithRating) => {
    try {
      // Fetch detailed album info
      const response = await apiRequest("GET", `/api/albums/${album.id}`);
      const detailedAlbum = await response.json();
      setSelectedAlbum(detailedAlbum);
      setIsModalOpen(true);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to load album details",
        variant: "destructive",
      });
    }
  };

  const handleQuickRating = (albumId: string, rating: number) => {
    quickRatingMutation.mutate({ albumId, rating });
  };

  const handleDeleteRating = (ratingId: string) => {
    if (confirm("Are you sure you want to delete this rating?")) {
      deleteRatingMutation.mutate(ratingId);
    }
  };

  const handleEditRating = (rating: RatingWithAlbum) => {
    const albumWithRating: AlbumWithRating = {
      ...rating.album,
      userRating: rating,
    };
    setSelectedAlbum(albumWithRating);
    setIsModalOpen(true);
  };

  // Sort ratings
  const sortedRatings = [...userRatings].sort((a, b) => {
    switch (sortBy) {
      case "rating-desc":
        return parseFloat(b.rating) - parseFloat(a.rating);
      case "rating-asc":
        return parseFloat(a.rating) - parseFloat(b.rating);
      case "recent":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "artist":
        return a.album.artist.localeCompare(b.album.artist);
      case "album":
        return a.album.name.localeCompare(b.album.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-dark-slate text-light-text">
      <NavigationHeader onSearch={handleSearch} searchQuery={searchQuery} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Hero */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white mb-4" data-testid="welcome-title">
              Discover & Rate Amazing Albums
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto" data-testid="welcome-description">
              Track your musical journey, rate your favorite albums, and discover new sounds from artists around the world.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="search"
                placeholder="Search for albums, artists..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-card-gray border border-gray-600 rounded-xl px-6 py-4 pr-12 text-lg focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
                data-testid="input-main-search"
              />
              <Button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-spotify-green hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                onClick={() => handleSearch(searchQuery)}
                data-testid="button-main-search"
              >
                <i className="fas fa-search"></i>
              </Button>
            </div>
          </div>
        </section>

        {/* Search Results */}
        {searchQuery && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white" data-testid="search-results-title">
                Search Results
              </h3>
              <span className="text-sm text-gray-400" data-testid="search-results-count">
                {searchMutation.isLoading ? "Searching..." : `${searchResults.length} albums found`}
              </span>
            </div>

            {searchMutation.isLoading && (
              <div className="text-center py-8">
                <div className="text-gray-400">Searching...</div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
                {searchResults.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onAlbumClick={handleAlbumClick}
                    onRatingChange={handleQuickRating}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Personal Rankings */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-white" data-testid="rankings-title">
              My Top Rated Albums
            </h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy} data-testid="select-sort">
                <SelectTrigger className="w-48 bg-card-gray border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating-desc">Rating (High to Low)</SelectItem>
                  <SelectItem value="rating-asc">Rating (Low to High)</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="artist">Artist Name</SelectItem>
                  <SelectItem value="album">Album Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {ratingsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading your ratings...</div>
            </div>
          ) : sortedRatings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400">No ratings yet. Start by searching and rating some albums!</div>
            </div>
          ) : (
            <div className="space-y-4" data-testid="ratings-list">
              {sortedRatings.slice(0, 10).map((rating, index) => (
                <div
                  key={rating.id}
                  className="bg-card-gray rounded-xl p-4 flex items-center space-x-4 hover:bg-gray-700 transition-colors"
                  data-testid={`rating-item-${rating.id}`}
                >
                  <div className="flex-shrink-0">
                    <span
                      className={`text-2xl font-bold ${
                        index === 0 ? "text-warm-yellow" : "text-gray-400"
                      }`}
                      data-testid={`ranking-position-${index + 1}`}
                    >
                      #{index + 1}
                    </span>
                  </div>
                  
                  <img
                    src={rating.album.coverUrl || "/api/placeholder/100/100"}
                    alt={`${rating.album.name} album cover`}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100";
                    }}
                    data-testid={`rating-album-cover-${rating.id}`}
                  />
                  
                  <div className="flex-grow min-w-0">
                    <h4 className="font-semibold text-white mb-1" data-testid={`rating-album-name-${rating.id}`}>
                      {rating.album.name}
                    </h4>
                    <p className="text-gray-400 text-sm mb-2" data-testid={`rating-album-artist-${rating.id}`}>
                      {rating.album.artist}
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <StarRating rating={parseFloat(rating.rating)} size="sm" />
                        <span className="text-sm text-gray-300 ml-2" data-testid={`rating-value-${rating.id}`}>
                          {rating.rating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500" data-testid={`rating-date-${rating.id}`}>
                        Rated {new Date(rating.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRating(rating)}
                      className="text-gray-400 hover:text-spotify-green"
                      title="Edit Rating"
                      data-testid={`button-edit-rating-${rating.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteRating(rating.id)}
                      className="text-gray-400 hover:text-red-500"
                      title="Delete Rating"
                      data-testid={`button-delete-rating-${rating.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Statistics Overview */}
        {userStats && (
          <section className="mb-12">
            <h3 className="text-2xl font-semibold text-white mb-6" data-testid="stats-title">
              Your Music Statistics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card-gray rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-spotify-green mb-2" data-testid="stat-total-rated">
                  {userStats.totalRated}
                </div>
                <div className="text-gray-300">Albums Rated</div>
              </div>
              <div className="bg-card-gray rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-warm-yellow mb-2" data-testid="stat-average-rating">
                  {userStats.averageRating.toFixed(1)}
                </div>
                <div className="text-gray-300">Average Rating</div>
              </div>
              <div className="bg-card-gray rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-deep-blue mb-2" data-testid="stat-unique-artists">
                  {userStats.uniqueArtists}
                </div>
                <div className="text-gray-300">Unique Artists</div>
              </div>
            </div>
          </section>
        )}
      </main>

      <AlbumDetailModal
        album={selectedAlbum}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAlbum(null);
        }}
      />
    </div>
  );
}
