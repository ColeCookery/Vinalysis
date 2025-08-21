import {
  users,
  albums,
  ratings,
  type User,
  type UpsertUser,
  type Album,
  type InsertAlbum,
  type Rating,
  type InsertRating,
  type UpdateRating,
  type RatingWithAlbum,
  type AlbumWithRating,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations 
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Album operations
  upsertAlbum(album: InsertAlbum): Promise<Album>;
  getAlbum(id: string): Promise<Album | undefined>;
  searchAlbums(query: string): Promise<Album[]>;
  
  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  updateRating(id: string, rating: UpdateRating): Promise<Rating>;
  deleteRating(id: string): Promise<void>;
  getUserRating(userId: string, albumId: string): Promise<Rating | undefined>;
  getUserRatings(userId: string): Promise<RatingWithAlbum[]>;
  getUserStats(userId: string): Promise<{
    totalRated: number;
    averageRating: number;
    uniqueArtists: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Album operations
  async upsertAlbum(albumData: InsertAlbum): Promise<Album> {
    const [album] = await db
      .insert(albums)
      .values(albumData)
      .onConflictDoUpdate({
        target: albums.id,
        set: albumData,
      })
      .returning();
    return album;
  }

  async getAlbum(id: string): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album;
  }

  async searchAlbums(query: string): Promise<Album[]> {
    // This would typically integrate with Spotify API
    // For now, return empty array as search will be handled by frontend
    return [];
  }

  // Rating operations
  async createRating(ratingData: InsertRating): Promise<Rating> {
    const [rating] = await db.insert(ratings).values(ratingData).returning();
    return rating;
  }

  async updateRating(id: string, ratingData: UpdateRating): Promise<Rating> {
    const [rating] = await db
      .update(ratings)
      .set({ ...ratingData, updatedAt: new Date() })
      .where(eq(ratings.id, id))
      .returning();
    return rating;
  }

  async deleteRating(id: string): Promise<void> {
    await db.delete(ratings).where(eq(ratings.id, id));
  }

  async getUserRating(userId: string, albumId: string): Promise<Rating | undefined> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), eq(ratings.albumId, albumId)));
    return rating;
  }

  async getUserRatings(userId: string): Promise<RatingWithAlbum[]> {
    const userRatings = await db
      .select({
        id: ratings.id,
        userId: ratings.userId,
        albumId: ratings.albumId,
        rating: ratings.rating,
        listened: ratings.listened,
        createdAt: ratings.createdAt,
        updatedAt: ratings.updatedAt,
        album: albums,
      })
      .from(ratings)
      .innerJoin(albums, eq(ratings.albumId, albums.id))
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.rating), desc(ratings.createdAt));

    return userRatings;
  }

  async getUserStats(userId: string): Promise<{
    totalRated: number;
    averageRating: number;
    uniqueArtists: number;
  }> {
    const userRatings = await db
      .select({
        rating: ratings.rating,
        artist: albums.artist,
      })
      .from(ratings)
      .innerJoin(albums, eq(ratings.albumId, albums.id))
      .where(eq(ratings.userId, userId));

    const totalRated = userRatings.length;
    const averageRating = totalRated > 0 
      ? userRatings.reduce((sum, r) => sum + parseFloat(r.rating), 0) / totalRated
      : 0;
    const uniqueArtists = new Set(userRatings.map(r => r.artist)).size;

    return {
      totalRated,
      averageRating: Math.round(averageRating * 10) / 10,
      uniqueArtists,
    };
  }
}

export const storage = new DatabaseStorage();
