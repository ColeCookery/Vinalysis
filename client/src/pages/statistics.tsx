import { useQuery } from "@tanstack/react-query";
import { NavigationHeader } from "@/components/navigation-header";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { RatingWithAlbum } from "@shared/schema";

export default function Statistics() {
  // Fetch user ratings
  const { data: ratings = [], isLoading: ratingsLoading } = useQuery<RatingWithAlbum[]>({
    queryKey: ["/api/ratings"],
  });

  // Fetch stats
  const { data: stats } = useQuery<{
    totalRated: number;
    averageRating: number;
    uniqueArtists: number;
  }>({
    queryKey: ["/api/stats"],
  });

  // Calculate rating distribution for bar chart
  const ratingDistribution = () => {
    const distribution = [
      { rating: "1", count: 0 },
      { rating: "2", count: 0 },
      { rating: "3", count: 0 },
      { rating: "4", count: 0 },
      { rating: "5", count: 0 },
    ];

    ratings.forEach(rating => {
      const ratingValue = Math.floor(parseFloat(rating.rating));
      if (ratingValue >= 1 && ratingValue <= 5) {
        distribution[ratingValue - 1].count++;
      }
    });

    return distribution;
  };

  // Calculate additional stats
  const additionalStats = () => {
    if (ratings.length === 0) return null;

    const ratingValues = ratings.map(r => parseFloat(r.rating));
    const sortedRatings = [...ratingValues].sort((a, b) => a - b);
    const median = sortedRatings.length % 2 === 0
      ? (sortedRatings[sortedRatings.length / 2 - 1] + sortedRatings[sortedRatings.length / 2]) / 2
      : sortedRatings[Math.floor(sortedRatings.length / 2)];

    const mode = ratingValues
      .reduce((acc, rating) => {
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

    const mostCommonRating = Object.entries(mode)
      .reduce((a, b) => mode[parseFloat(a[0])] > mode[parseFloat(b[0])] ? a : b)[0];

    const listenedCount = ratings.filter(r => r.listened).length;
    const listenedPercentage = (listenedCount / ratings.length) * 100;

    return {
      median: median.toFixed(1),
      mostCommonRating: parseFloat(mostCommonRating).toFixed(1),
      listenedCount,
      listenedPercentage: listenedPercentage.toFixed(1),
      highestRated: Math.max(...ratingValues).toFixed(1),
      lowestRated: Math.min(...ratingValues).toFixed(1),
    };
  };

  const chartData = ratingDistribution();
  const extraStats = additionalStats();

  return (
    <div className="min-h-screen bg-dark-slate">
      <NavigationHeader onSearch={() => {}} searchQuery="" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="page-title">
            Statistics
          </h1>
          <p className="text-gray-400">
            Detailed analytics of your music rating patterns and listening habits
          </p>
        </div>

        {ratingsLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading your statistics...</div>
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400">No ratings yet. Start by searching and rating some albums to see your statistics!</div>
          </div>
        ) : (
          <>
            {/* Main Statistics */}
            {stats && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6" data-testid="main-stats-title">
                  Overview
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-card-gray rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-spotify-green mb-2" data-testid="total-rated">
                      {stats.totalRated}
                    </div>
                    <div className="text-gray-400">Albums Rated</div>
                  </div>
                  <div className="bg-card-gray rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-warm-yellow mb-2" data-testid="average-rating">
                      {stats.averageRating?.toFixed(1) || "0.0"}
                    </div>
                    <div className="text-gray-400">Average Rating</div>
                  </div>
                  <div className="bg-card-gray rounded-xl p-6 text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-2" data-testid="unique-artists">
                      {stats.uniqueArtists}
                    </div>
                    <div className="text-gray-400">Unique Artists</div>
                  </div>
                </div>
              </section>
            )}

            {/* Rating Distribution Chart */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6" data-testid="distribution-title">
                Rating Distribution
              </h2>
              <div className="bg-card-gray rounded-xl p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="rating" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 14 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9CA3AF', fontSize: 14 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#374151', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#F3F4F6'
                      }}
                      labelFormatter={(value) => `${value} Star${value === '1' ? '' : 's'}`}
                      formatter={(value) => [`${value} album${value === 1 ? '' : 's'}`, 'Count']}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#1DB954"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Additional Statistics */}
            {extraStats && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6" data-testid="detailed-stats-title">
                  Detailed Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-card-gray rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-blue-400 mb-2" data-testid="median-rating">
                      {extraStats.median}
                    </div>
                    <div className="text-gray-400">Median Rating</div>
                  </div>
                  <div className="bg-card-gray rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-orange-400 mb-2" data-testid="most-common-rating">
                      {extraStats.mostCommonRating}
                    </div>
                    <div className="text-gray-400">Most Common Rating</div>
                  </div>
                  <div className="bg-card-gray rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2" data-testid="listened-count">
                      {extraStats.listenedCount}
                    </div>
                    <div className="text-gray-400">Albums Listened</div>
                  </div>
                  <div className="bg-card-gray rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2" data-testid="listened-percentage">
                      {extraStats.listenedPercentage}%
                    </div>
                    <div className="text-gray-400">Listened Rate</div>
                  </div>
                  <div className="bg-card-gray rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-red-400 mb-2" data-testid="highest-rating">
                      {extraStats.highestRated}
                    </div>
                    <div className="text-gray-400">Highest Rating</div>
                  </div>
                  <div className="bg-card-gray rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-red-400 mb-2" data-testid="lowest-rating">
                      {extraStats.lowestRated}
                    </div>
                    <div className="text-gray-400">Lowest Rating</div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}