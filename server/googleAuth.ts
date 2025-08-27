// googleAuth.ts
import { type Express, type RequestHandler } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from "passport-google-oauth20";
import { storage } from "./storage";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
  throw new Error("Google auth environment variables missing");
}

export const setupGoogleAuth = (app: Express) => {
  // Trust proxies (important for Render)
  app.set("trust proxy", 1);

  // Session setup
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
        secure: process.env.NODE_ENV === "production", // only over HTTPS in production
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize user ID into session
  passport.serializeUser((user: any, done) => {
    done(null, user.sub); // store Google 'sub' in session
  });

  // Deserialize user from DB
  passport.deserializeUser(async (sub: string, done) => {
    try {
      const dbUser = await storage.getUser(sub);
      if (!dbUser) return done(null, null);

      // Always include sub for consistency
      done(null, { ...dbUser, sub: dbUser.id });
    } catch (err) {
      done(err as any);
    }
  });

  // Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (accessToken, refreshToken, profile: GoogleProfile, done) => {
        try {
          const user = {
            sub: profile.id, // unique Google identifier
            email: profile.emails?.[0]?.value || "",
            username: profile.displayName || "",
            avatarUrl: profile.photos?.[0]?.value || null,
          };

          // Upsert into your DB
          await storage.upsertUser({
            id: user.sub,
            email: user.email,
            firstName: profile.displayName || user.username,
            lastName: "",
            profileImageUrl: user.avatarUrl,
          });

          done(null, user);
        } catch (err) {
          done(err as any);
        }
      }
    )
  );

  // Routes
  app.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", {
      successRedirect: process.env.FRONTEND_URL || "/",
      failureRedirect: "/login",
    })
  );

  app.get("/api/logout/google", (req, res, next) => {
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
