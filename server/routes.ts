import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAlbumSchema, insertRatingSchema, updateRatingSchema } from "@shared/schema";
import { ensureAuthenticated } from "./googleAuth";

export async function registerRoutes(app: Express): Promise<Server> {

  // Get current authenticated user
  app.get('/api/auth/user', ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Spotify search proxy
  app.get('/api/search', ensureAuthenticated, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ message: "Query parameter 'q' is required" });

      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      if (!clientId || !clientSecret) return res.status(500).json({ message: "Spotify API credentials not configured" });

      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok) throw new Error(`Spotify token error: ${tokenData.error_description || tokenData.error}`);

      const searchResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=20`,
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      );
      const searchData = await searchResponse.json();
      if (!searchResponse.ok) throw new Error(`Spotify search error: ${searchData.error?.message || 'Unknown error'}`);

      const userId = req.user.sub;
      const albums = await Promise.all(
        searchData.albums.items.map(async (album: any) => {
          const albumData = {
            id: album.id,
            name: album.name,
            artist: album.artists.map((a: any) => a.name).join(', '),
            releaseDate: album.release_date,
            coverUrl: album.images[0]?.url || null,
            spotifyUrl: album.external_urls.spotify,
            genre: null,
            label: album.label || null,
            duration: null,
          };

          const userRating = await storage.getUserRating(userId, album.id);
          return { ...albumData, userRating };
        })
      );

      res.json(albums);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Get album details
  app.get('/api/albums/:id', ensureAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.sub;

      let album = await storage.getAlbum(id);
      
      if (!album) {
        // Fetch from Spotify if not in our database
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          return res.status(500).json({ message: "Spotify API credentials not configured" });
        }

        // Get access token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
          },
          body: 'grant_type=client_credentials'
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
          return res.status(500).json({ message: "Failed to get Spotify token" });
        }

        // Get album details
        const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });

        if (!albumResponse.ok) {
          return res.status(404).json({ message: "Album not found" });
        }

        const spotifyAlbum = await albumResponse.json();
        
        // Save to our database
        const albumData = {
          id: spotifyAlbum.id,
          name: spotifyAlbum.name,
          artist: spotifyAlbum.artists.map((a: any) => a.name).join(', '),
          releaseDate: spotifyAlbum.release_date,
          coverUrl: spotifyAlbum.images[0]?.url || null,
          spotifyUrl: spotifyAlbum.external_urls.spotify,
          genre: spotifyAlbum.genres?.join(', ') || null,
          label: spotifyAlbum.label || null,
          duration: spotifyAlbum.tracks.items.reduce((total: number, track: any) => total + track.duration_ms, 0),
        };

        album = await storage.upsertAlbum(albumData);
      }

      // Get user's rating for this album
      const userRating = await storage.getUserRating(userId, id);

      res.json({
        ...album,
        userRating
      });
    } catch (error) {
      console.error("Error fetching album:", error);
      res.status(500).json({ message: "Failed to fetch album" });
    }
  });

  // Create or update rating
  app.post('/api/ratings', ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        userId
      });

      // Ensure album exists in database first
      let album = await storage.getAlbum(ratingData.albumId);
      if (!album) {
        // Get Spotify access token
        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
          },
          body: 'grant_type=client_credentials',
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Fetch album data from Spotify and save it
        const spotifyResponse = await fetch(`https://api.spotify.com/v1/albums/${ratingData.albumId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (spotifyResponse.ok) {
          const spotifyAlbum = await spotifyResponse.json();
          const albumData = {
            id: spotifyAlbum.id,
            name: spotifyAlbum.name,
            artist: spotifyAlbum.artists.map((a: any) => a.name).join(', '),
            coverUrl: spotifyAlbum.images[0]?.url || null,
            releaseDate: spotifyAlbum.release_date,
            totalTracks: spotifyAlbum.total_tracks,
            genres: spotifyAlbum.genres || [],
            label: spotifyAlbum.label || null,
            duration: spotifyAlbum.tracks.items.reduce((total: number, track: any) => total + track.duration_ms, 0),
          };

          album = await storage.upsertAlbum(albumData);
        } else {
          return res.status(400).json({ message: "Album not found" });
        }
      }

      // Check if rating already exists
      const existingRating = await storage.getUserRating(userId, ratingData.albumId);
      
      let rating;
      if (existingRating) {
        rating = await storage.updateRating(existingRating.id, {
          rating: ratingData.rating,
          listened: ratingData.listened !== undefined ? ratingData.listened : true, // Auto-mark as listened when rating if not explicitly set
        });
      } else {
        rating = await storage.createRating({
          ...ratingData,
          listened: ratingData.listened !== undefined ? ratingData.listened : true, // Auto-mark as listened when rating if not explicitly set
        });
      }

      res.json(rating);
    } catch (error) {
      console.error("Error saving rating:", error);
      res.status(500).json({ message: "Failed to save rating" });
    }
  });

  // Update rating
  app.put('/api/ratings/:id', ensureAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const ratingData = updateRatingSchema.parse(req.body);

      const rating = await storage.updateRating(id, ratingData);
      res.json(rating);
    } catch (error) {
      console.error("Error updating rating:", error);
      res.status(500).json({ message: "Failed to update rating" });
    }
  });

  // Delete rating
  app.delete('/api/ratings/:id', ensureAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRating(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting rating:", error);
      res.status(500).json({ message: "Failed to delete rating" });
    }
  });

  // Get user's ratings
  app.get('/api/ratings', ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const ratings = await storage.getUserRatings(userId);
      res.json(ratings);
    } catch (error) {
      console.error("Error fetching ratings:", error);
      res.status(500).json({ message: "Failed to fetch ratings" });
    }
  });

  // Get user stats
  app.get('/api/stats', ensureAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
