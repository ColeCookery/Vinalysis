import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { X } from "lucide-react";
import type { AlbumWithRating } from "@shared/schema";

interface AlbumDetailModalProps {
  album: AlbumWithRating | null;
  isOpen: boolean;
  onClose: () => void;
  onRatingUpdate?: () => void;
}

export function AlbumDetailModal({ album, isOpen, onClose, onRatingUpdate }: AlbumDetailModalProps) {
  const [rating, setRating] = useState(0);
  const [listened, setListened] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (album?.userRating) {
      setRating(parseFloat(album.userRating.rating));
      setListened(album.userRating.listened || false);
    } else {
      setRating(0);
      setListened(false);
    }
  }, [album]);

  const saveRatingMutation = useMutation({
    mutationFn: async ({ albumId, rating, listened }: { albumId: string; rating: number; listened: boolean }) => {
      return await apiRequest("POST", "/api/ratings", {
        albumId,
        rating: rating.toString(),
        listened,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Rating saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ratings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      if (onRatingUpdate) {
        onRatingUpdate();
      }
      onClose();
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
        description: "Failed to save rating",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!album || rating === 0) return;
    
    saveRatingMutation.mutate({
      albumId: album.id,
      rating,
      listened,
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !album) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center min-h-screen px-4"
      onClick={handleBackdropClick}
      data-testid="album-detail-modal"
    >
      <div
        className="bg-card-gray rounded-2xl p-8 max-w-2xl w-full max-h-screen overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-white" data-testid="modal-title">Album Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            data-testid="button-close-modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <img
              src={album.coverUrl || "/api/placeholder/300/300"}
              alt={`${album.name} album cover`}
              className="w-72 h-72 object-cover rounded-xl shadow-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300";
              }}
              data-testid="modal-album-cover"
            />
          </div>

          <div className="flex-grow">
            <h3 className="text-xl font-bold text-white mb-2" data-testid="modal-album-name">
              {album.name}
            </h3>
            <p className="text-lg text-gray-300 mb-2" data-testid="modal-album-artist">
              {album.artist}
            </p>
            <p className="text-gray-400 text-sm mb-4" data-testid="modal-album-release">
              Released {album.releaseDate ? new Date(album.releaseDate).toLocaleDateString() : "Unknown"}
            </p>

            {/* Rating Section */}
            <div className="bg-dark-slate rounded-xl p-6 mb-6">
              <h4 className="font-semibold text-white mb-4" data-testid="rating-section-title">Rate this album</h4>
              
              <div className="mb-4">
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  interactive={true}
                  size="lg"
                  data-testid="modal-star-rating"
                />
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="listened"
                  checked={listened}
                  onCheckedChange={(checked) => setListened(!!checked)}
                  data-testid="checkbox-listened"
                />
                <label htmlFor="listened" className="text-gray-300 cursor-pointer">
                  Mark as listened
                </label>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={handleSave}
                  disabled={rating === 0 || saveRatingMutation.isPending}
                  className="bg-spotify-green hover:bg-green-600 text-white"
                  data-testid="button-save-rating"
                >
                  {saveRatingMutation.isPending ? "Saving..." : "Save Rating"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  data-testid="button-cancel-rating"
                >
                  Cancel
                </Button>
              </div>
            </div>

            {/* Album Info */}
            <div className="space-y-2 text-sm">
              {album.genre && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Genre:</span>
                  <span className="text-gray-300" data-testid="modal-album-genre">{album.genre}</span>
                </div>
              )}
              {album.label && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Label:</span>
                  <span className="text-gray-300" data-testid="modal-album-label">{album.label}</span>
                </div>
              )}
              {album.duration && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-gray-300" data-testid="modal-album-duration">
                    {Math.round(album.duration / 60000)} minutes
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
