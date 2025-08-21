// githubAuth.ts
import express, { type Express, type RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { storage } from "./storage";

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET || !process.env.BASE_URL) {
  throw new Error("GitHub auth environment variables missing");
}

export function setupGitHubAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev_secret",
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, secure: false },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, done) => done(null, user));
  passport.deserializeUser((user: Express.User, done) => done(null, user));

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: `${process.env.BASE_URL}/api/auth/github/callback`,
      },
      async function (
        accessToken: string,
        refreshToken: string | undefined,
        profile: GitHubProfile,
        done: (error: any, user?: Express.User | false) => void
      ) {
        try {
          const user = {
            id: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            avatarUrl: profile.photos?.[0]?.value || null,
          };

          // Upsert user in your database
          await storage.upsertUser({
            id: user.id,
            email: profile.emails?.[0]?.value || "",
            firstName: profile.displayName || "",
            lastName: "",
            profileImageUrl: user.avatarUrl,
          });

          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );

  // Routes
  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", {
      successRedirect: "/",
      failureRedirect: "/login",
    })
  );

  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

// Middleware to protect routes
export const ensureAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};
