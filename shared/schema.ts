import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Albums table
export const albums = pgTable("albums", {
  id: varchar("id").primaryKey(), // Spotify album ID
  name: text("name").notNull(),
  artist: text("artist").notNull(),
  releaseDate: varchar("release_date"),
  coverUrl: text("cover_url"),
  spotifyUrl: text("spotify_url"),
  genre: text("genre"),
  label: text("label"),
  duration: integer("duration"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Ratings table
export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  albumId: varchar("album_id").notNull().references(() => albums.id),
  rating: decimal("rating", { precision: 2, scale: 1 }).notNull(), // 0.0 to 5.0
  listened: boolean("listened").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ratings: many(ratings),
}));

export const albumsRelations = relations(albums, ({ many }) => ({
  ratings: many(ratings),
}));

export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  album: one(albums, {
    fields: [ratings.albumId],
    references: [albums.id],
  }),
}));

// Insert schemas
export const insertAlbumSchema = createInsertSchema(albums).omit({
  createdAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  userId: true,
  albumId: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type UpdateRating = z.infer<typeof updateRatingSchema>;

// Extended types for API responses
export type RatingWithAlbum = Rating & {
  album: Album;
};

export type AlbumWithRating = Album & {
  userRating?: Rating;
};
