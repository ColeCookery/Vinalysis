import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Disc3, Search, Menu, User } from "lucide-react";

interface NavigationHeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

export function NavigationHeader({ onSearch, searchQuery }: NavigationHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-card-gray border-b border-gray-600 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <Disc3 className="text-spotify-green text-2xl mr-2" />
              <h1 className="text-xl font-bold text-white" data-testid="app-title">Vinalysis</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a
                href="#discover"
                className="text-light-text hover:text-spotify-green transition-colors px-3 py-2 rounded-md font-medium"
                data-testid="link-discover"
              >
                Discover
              </a>
              <a
                href="#my-ratings"
                className="text-light-text hover:text-spotify-green transition-colors px-3 py-2 rounded-md font-medium"
                data-testid="link-my-ratings"
              >
                My Ratings
              </a>
              <a
                href="#rankings"
                className="text-light-text hover:text-spotify-green transition-colors px-3 py-2 rounded-md font-medium"
                data-testid="link-rankings"
              >
                Rankings
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="search"
                  placeholder="Search albums..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="bg-dark-slate border-gray-600 rounded-lg px-4 py-2 pr-10 w-64 focus:ring-2 focus:ring-spotify-green focus:border-transparent"
                  data-testid="input-search-desktop"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-gray-700 text-gray-400 p-1"
                  data-testid="button-search-desktop"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
            
            <div className="flex items-center space-x-2">
              {(user as any)?.profileImageUrl ? (
                <img
                  src={(user as any).profileImageUrl}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                  data-testid="img-profile"
                />
              ) : (
                <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="hidden sm:block text-sm text-light-text" data-testid="text-username">
                {(user as any)?.firstName || (user as any)?.email || "User"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:block text-gray-400 hover:text-white"
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-light-text hover:text-spotify-green"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card-gray border-b border-gray-600" data-testid="mobile-menu">
          <div className="px-4 py-3 space-y-2">
            <a href="#discover" className="block text-light-text hover:text-spotify-green py-2">
              Discover
            </a>
            <a href="#my-ratings" className="block text-light-text hover:text-spotify-green py-2">
              My Ratings
            </a>
            <a href="#rankings" className="block text-light-text hover:text-spotify-green py-2">
              Rankings
            </a>
            <div className="pt-2 border-t border-gray-600">
              <form onSubmit={handleSearch}>
                <Input
                  type="search"
                  placeholder="Search albums..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full bg-dark-slate border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-spotify-green"
                  data-testid="input-search-mobile"
                />
              </form>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-400 hover:text-white"
              data-testid="button-logout-mobile"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
