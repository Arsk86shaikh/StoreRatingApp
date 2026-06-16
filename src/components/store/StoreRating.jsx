import { useState } from 'react';

export default function StoreRating({ store }) {
  const averageRating = store.average_rating || 0;
  const ratingCount = store.rating_count || 0;

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-blue-600';
    if (rating >= 2.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Good';
    if (rating >= 2.5) return 'Average';
    if (rating > 0) return 'Poor';
    return 'No ratings yet';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                className={`text-lg ${
                  i < Math.round(averageRating)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
          <span className={`font-bold text-lg ${getRatingColor(averageRating)}`}>
            {averageRating.toFixed(1)}
          </span>
        </div>
        <span className="text-sm text-gray-600">
          {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
        </span>
      </div>

      <div className="text-sm text-gray-700">
        <p>
          <span className="font-medium">Rating Status:</span>{' '}
          <span className={`font-semibold ${getRatingColor(averageRating)}`}>
            {getRatingLabel(averageRating)}
          </span>
        </p>
      </div>

      {/* Rating Distribution */}
      <div className="mt-3 space-y-1 text-xs">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = store[`rating_${stars}_count`] || 0;
          const percentage = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
          
          return (
            <div key={stars} className="flex items-center gap-2">
              <span className="w-8 text-gray-600">{stars}★</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-gray-600 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
