// client/src/pages/landing.tsx
"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Disc3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const handleLogin = () => {
    // Trigger the server-side Google OAuth flow
    window.location.href = "/api/auth/google";
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // If already logged in, go to discover (or your preferred page)
      window.location.href = "/discover";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) return <div className="p-8">Checking auth…</div>;

  return (
    <div className="min-h-screen bg-dark-slate text-light-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="flex justify-center items-center mb-8">
            <Disc3 className="text-spotify-green text-6xl mr-4" />
            <h1 className="text-5xl font-bold text-white" data-testid="landing-title">Vinalysis</h1>
          </div>
          
          <h2 className="text-4xl font-bold text-white mb-4" data-testid="landing-subtitle">
            Discover & Rate Amazing Albums
          </h2>
          
          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8" data-testid="landing-description">
            Rank music, save ratings, and compare your taste — sign in with Google to get started.
          </p>
          
          <Button onClick={handleLogin} size="lg">
            Get Started
          </Button>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card-gray rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-spotify-green mb-2">🎵</div>
              <h3 className="text-xl font-semibold text-white mb-2">Discover Music</h3>
              <p className="text-gray-400">Search and explore albums from your favorite artists</p>
            </div>
            
            <div className="bg-card-gray rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-warm-yellow mb-2">⭐</div>
              <h3 className="text-xl font-semibold text-white mb-2">Rate Albums</h3>
              <p className="text-gray-400">Rate albums with our precise 5-star rating system</p>
            </div>
            
            <div className="bg-card-gray rounded-xl p-6 text-center">
              <div className="text-3xl font-bold text-deep-blue mb-2">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Track Progress</h3>
              <p className="text-gray-400">View your personal rankings and music statistics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
