import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StarRating({
  rating,
  onRatingChange,
  interactive = false,
  size = "md",
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive ? (hoverRating || rating) : rating;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-2xl",
  };

  const handleStarClick = (starRating: number) => {
    if (!interactive || !onRatingChange) return;
    onRatingChange(starRating);
  };

  const handleStarHover = (starRating: number) => {
    if (!interactive) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const renderStar = (starIndex: number) => {
    const starValue = starIndex + 0.5;
    const fullStarValue = starIndex + 1;
    
    const isHalfFilled = displayRating >= starValue && displayRating < fullStarValue;
    const isFilled = displayRating >= fullStarValue;

    return (
      <div
        key={starIndex}
        className="relative inline-block"
        onMouseLeave={handleMouseLeave}
      >
        {/* Half star clickable area */}
        <button
          className={cn(
            "absolute left-0 top-0 w-1/2 h-full z-10",
            interactive && "cursor-pointer"
          )}
          onClick={() => handleStarClick(starValue)}
          onMouseEnter={() => handleStarHover(starValue)}
          disabled={!interactive}
          data-testid={`star-half-${starIndex}`}
        />
        
        {/* Full star clickable area */}
        <button
          className={cn(
            "absolute right-0 top-0 w-1/2 h-full z-10",
            interactive && "cursor-pointer"
          )}
          onClick={() => handleStarClick(fullStarValue)}
          onMouseEnter={() => handleStarHover(fullStarValue)}
          disabled={!interactive}
          data-testid={`star-full-${starIndex}`}
        />

        {/* Visual star */}
        <div className="relative">
          {/* Background star */}
          <i
            className={cn(
              "fas fa-star text-gray-600",
              sizeClasses[size],
              interactive && "transition-colors"
            )}
          />
          
          {/* Filled portion */}
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{
              width: isFilled ? "100%" : isHalfFilled ? "50%" : "0%",
            }}
          >
            <i
              className={cn(
                "fas fa-star text-warm-yellow",
                sizeClasses[size],
                interactive && "transition-colors"
              )}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex items-center space-x-1", className)} data-testid="star-rating">
      {[0, 1, 2, 3, 4].map(renderStar)}
      {size === "lg" && (
        <span className="text-gray-300 ml-4" data-testid="rating-display">
          {displayRating > 0 ? displayRating.toFixed(1) : "Click to rate"}
        </span>
      )}
    </div>
  );
}
