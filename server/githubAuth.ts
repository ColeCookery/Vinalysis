// githubAuth.ts
import { type Express, type RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from "passport-github2";
import { storage } from "./storage";

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET || !process.env.GITHUB_CALLBACK_URL) {
  throw new Error("GitHub auth environment variables missing");
}

export const setupGitHubAuth = (app: Express) => {
  // Required when behind Render/Heroku proxies so secure cookies are honored
  app.set("trust proxy", 1);

  app.use(
    session({
      name: "vinalysis.sid",
      secret: process.env.SESSION_SECRET || "dev_secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Store only the ID in the session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const dbUser = await storage.getUser(id);
      done(null, dbUser);
    } catch (err) {
      done(err as any);
    }
  });

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: process.env.GITHUB_CALLBACK_URL!,
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile: GitHubProfile, done) => {
        try {
          const user = {
            id: profile.id,
            username: profile.username || profile.displayName || "",
            avatarUrl: profile.photos?.[0]?.value || null,
          };

          // Upsert into DB
          await storage.upsertUser({
            id: user.id,
            email: profile.emails?.[0]?.value || "",
            firstName: profile.displayName || user.username,
            lastName: "",
            profileImageUrl: user.avatarUrl,
          });

          return done(null, user);
        } catch (err) {
          return done(err as any);
        }
      }
    )
  );

  // Routes
  app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

  app.get(
    "/api/auth/github/callback",
    passport.authenticate("github", {
      successRedirect: process.env.FRONTEND_URL || "/",
      failureRedirect: "/login",
    })
  );

  app.get("/api/logout/github", (req, res, next) => {
    req.logout(err => {
      if (err) return next(err);
      res.redirect("/");
    });
  });
};

// Middleware to protect routes
export const ensureAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
};
