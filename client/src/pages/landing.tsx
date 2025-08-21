"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Disc3 } from "lucide-react";

export default function Landing() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = () => {
    window.location.href = "/api/login/github";
  };

  if (loading) return <div>Loading...</div>;

  // Redirect logged-in users to dashboard
  if (user) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard"; // or your main app page
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-dark-slate text-light-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="flex justify-center items-center mb-8">
            <Disc3 className="text-spotify-green text-6xl mr-4" />
            <h1 className="text-5xl font-bold text-white">Vinalysis</h1>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">
            Discover & Rate Amazing Albums
          </h2>

          <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
            Track your musical journey, rate your favorite albums, and discover new sounds.
          </p>

          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-spotify-green hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
