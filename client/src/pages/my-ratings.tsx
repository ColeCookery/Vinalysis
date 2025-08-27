import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { AlbumDetailModal } from "@/components/album-detail-modal";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Edit, Trash2, Eye } from "lucide-react";
import type { AlbumWithRating, RatingWithAlbum } from "@shared/schema";

export default function MyRatings() {
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithRating | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("rating-desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user ratings
  const { data: ratings = [], isLoading: ratingsLoading } = useQuery<RatingWithAlbum[]>({
    queryKey: ["/api/ratings"],
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
          window.location.href = "/api/login/google";
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

  const handleEditRating = (rating: RatingWithAlbum) => {
    const albumWithRating: AlbumWithRating = {
      ...rating.album,
      userRating: rating,
    };
    setSelectedAlbum(albumWithRating);
    setIsModalOpen(true);
  };

  const handleDeleteRating = (ratingId: string) => {
    if (confirm("Are you sure you want to delete this rating?")) {
      deleteRatingMutation.mutate(ratingId);
    }
  };

  // Sort ratings based on selected criteria
  const sortedRatings = [...ratings].sort((a, b) => {
    switch (sortBy) {
      case "rating-desc":
        return parseFloat(b.rating) - parseFloat(a.rating);
      case "rating-asc":
        return parseFloat(a.rating) - parseFloat(b.rating);
      case "recent":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "artist":
        return a.album.artist.localeCompare(b.album.artist);
      case "album":
        return a.album.name.localeCompare(b.album.name);
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-dark-slate">
      <NavigationHeader onSearch={() => {}} searchQuery="" showSearch={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2" data-testid="page-title">
                My Ratings
              </h1>
              <p className="text-gray-400">
                All {ratings.length} albums you've rated and marked as listened
              </p>
            </div>
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
              {sortedRatings.map((rating, index) => (
                <div
                  key={rating.id}
                  className={`bg-card-gray rounded-xl p-4 flex items-center space-x-4 hover:bg-gray-700 transition-colors ${
                    rating.listened ? "opacity-75" : ""
                  }`}
                  data-testid={`rating-item-${rating.id}`}
                >
                  <div className="flex-shrink-0">
                    <span
                      className={`text-2xl font-bold ${
                        index === 0 && sortBy === "rating-desc" ? "text-warm-yellow" : "text-gray-400"
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
                      {rating.album.artist} {rating.album.releaseDate ? `• ${new Date(rating.album.releaseDate).getFullYear()}` : ''}
                    </p>
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center space-x-1">
                        <StarRating rating={parseFloat(rating.rating)} size="sm" />
                        <span className="text-sm text-gray-300 ml-2" data-testid={`rating-value-${rating.id}`}>
                          {rating.rating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500" data-testid={`rating-date-${rating.id}`}>
                        Rated {new Date(rating.createdAt || 0).toLocaleDateString()}
                      </span>
                    </div>
                    {rating.listened && (
                      <div className="flex items-center space-x-1">
                        <Eye className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-green-400" data-testid={`rating-listened-${rating.id}`}>
                          Listened
                        </span>
                      </div>
                    )}
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
                      className="text-gray-400 hover:text-red-400"
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