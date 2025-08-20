# MusicRate

## Overview

MusicRate is a full-stack music rating application that allows users to discover, rate, and track albums from the Spotify catalog. The application provides a personalized music rating experience with comprehensive search functionality and user statistics tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application using functional components with hooks
- **ShadCN UI Components**: Comprehensive UI component library built on Radix UI primitives
- **TanStack Query**: Handles server state management, caching, and synchronization
- **Wouter**: Lightweight client-side routing solution
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens for consistent theming
- **Vite**: Fast build tool with hot module replacement for development

### Backend Architecture
- **Express.js**: RESTful API server with middleware for request logging and error handling
- **TypeScript**: Full type safety across the entire backend codebase
- **Session-based Architecture**: Stateful sessions stored in PostgreSQL for user authentication
- **Modular Storage Layer**: Abstracted database operations through an interface pattern for maintainability

### Database Design
- **PostgreSQL**: Primary database using Neon serverless infrastructure
- **Drizzle ORM**: Type-safe database toolkit with schema-first approach
- **Schema Structure**:
  - Users table with profile information (required for Replit Auth)
  - Albums table storing Spotify metadata (ID, name, artist, cover art, etc.)
  - Ratings table linking users to albums with numeric ratings and listening status
  - Sessions table for authentication state (required for Replit Auth)

### Authentication System
- **Replit Authentication**: OIDC-based authentication with automatic user provisioning
- **Session Management**: PostgreSQL-backed session store with configurable TTL
- **Middleware Protection**: Route-level authentication guards for API endpoints

### API Design
- **RESTful Endpoints**: Consistent API structure with proper HTTP status codes
- **Request/Response Validation**: Zod schemas for type-safe data validation
- **Error Handling**: Centralized error handling with user-friendly messages
- **Rate Limiting**: Built-in protection against abuse through session management

## External Dependencies

### Third-party Services
- **Spotify Web API**: Album search functionality using client credentials flow
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Replit Authentication**: OIDC provider for user authentication and authorization

### Key Libraries
- **Frontend**: React, TanStack Query, Wouter, ShadCN UI, Tailwind CSS
- **Backend**: Express, Drizzle ORM, Passport (OpenID Connect strategy)
- **Database**: PostgreSQL with Neon serverless driver
- **Development**: Vite, TypeScript, ESLint configuration