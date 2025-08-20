import { useState } from "react";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import type { AlbumWithRating } from "@shared/schema";

interface AlbumCardProps {
  album: AlbumWithRating;
  onAlbumClick: (album: AlbumWithRating) => void;
  onRatingChange?: (albumId: string, rating: number) => void;
}

export function AlbumCard({ album, onAlbumClick, onRatingChange }: AlbumCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isListened = album.userRating?.listened || false;

  const handleRatingChange = (rating: number) => {
    if (onRatingChange) {
      onRatingChange(album.id, rating);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on star rating
    if ((e.target as HTMLElement).closest('[data-testid*="star"]')) {
      return;
    }
    onAlbumClick(album);
  };

  return (
    <div
      className={cn(
        "bg-card-gray rounded-xl p-4 transition-all duration-300 cursor-pointer group",
        isHovered && "bg-gray-700",
        isListened && "opacity-60 bg-gray-800"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      data-testid={`album-card-${album.id}`}
    >
      <img
        src={album.coverUrl || "/api/placeholder/400/400"}
        alt={`${album.name} album cover`}
        className={cn(
          "w-full aspect-square object-cover rounded-lg mb-3 group-hover:shadow-lg transition-all",
          isListened && "grayscale-[50%]"
        )}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400";
        }}
        data-testid={`album-cover-${album.id}`}
      />
      
      <h4 className={cn(
        "font-semibold text-sm mb-1 truncate",
        isListened ? "text-gray-300" : "text-white"
      )} data-testid={`album-name-${album.id}`}>
        {album.name}
      </h4>
      
      <p className={cn(
        "text-xs mb-2 truncate",
        isListened ? "text-gray-500" : "text-gray-400"
      )} data-testid={`album-artist-${album.id}`}>
        {album.artist}
      </p>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500" data-testid={`album-year-${album.id}`}>
          {album.releaseDate ? new Date(album.releaseDate).getFullYear() : ""}
        </span>
        
        {isListened && (
          <div className="flex items-center space-x-1">
            <Eye className="h-3 w-3 text-green-400" />
            <span className="text-xs text-green-400" data-testid={`album-listened-${album.id}`}>
              Listened
            </span>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <StarRating
          rating={album.userRating?.rating ? parseFloat(album.userRating.rating) : 0}
          onRatingChange={handleRatingChange}
          interactive={true}
          size="sm"
          data-testid={`album-rating-${album.id}`}
        />
      </div>
    </div>
  );
}
