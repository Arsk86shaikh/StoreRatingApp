export default function RecentRatings({ ratings = [], limit = 5 }) {
  const displayRatings = ratings.slice(0, limit);

  if (ratings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Ratings</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No ratings yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Ratings</h3>

      <div className="space-y-3">
        {displayRatings.map((rating, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {rating.store_name}
              </p>
              <p className="text-sm text-gray-600">
                by {rating.user_name || 'Anonymous'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      i < rating.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="font-bold text-gray-900 w-6 text-right">
                {rating.rating}
              </span>
            </div>
          </div>
        ))}
      </div>

      {ratings.length > limit && (
        <p className="text-sm text-gray-500 text-center mt-4">
          +{ratings.length - limit} more ratings
        </p>
      )}
    </div>
  );
}
