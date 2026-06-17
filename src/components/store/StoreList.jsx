import { useState } from 'react';

export default function StoreList({ stores, userRatings, onRatingSubmit }) {
  const [selectedStoreId, setSelectedStoreId] = useState(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleRatingChange = (storeId, rating) => {
    setSelectedStoreId(storeId);
    setSelectedRating(rating);
  };

  const handleSubmit = async (storeId) => {
    try {
      setSubmitting(true);
      await onRatingSubmit({
        storeId,
        rating: selectedRating || userRatings[storeId] || 0,
      });
      setSelectedStoreId(null);
      setSelectedRating(0);
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!stores || stores.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No stores available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => {
        const userRating = userRatings[store.id] || 0;
        const isSelected = selectedStoreId === store.id;

        return (
          <div
            key={store.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200"
          >
            <div className="p-6">
              {/* Store Header */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{store.name}</h3>

              {/* Store Details */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                {store.address && (
                  <p className="flex items-start gap-2">
                    <span>📍</span>
                    <span>{store.address}</span>
                  </p>
                )}
                {store.phone && (
                  <p className="flex items-center gap-2">
                    <span>📞</span>
                    <span>{store.phone}</span>
                  </p>
                )}
                {store.email && (
                  <p className="flex items-center gap-2">
                    <span>📧</span>
                    <span>{store.email}</span>
                  </p>
                )}
                {store.category && (
                  <p className="flex items-center gap-2">
                    <span>🏷️</span>
                    <span className="capitalize">{store.category}</span>
                  </p>
                )}
              </div>

              {/* Current Rating */}
              {userRating > 0 && !isSelected && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-600 font-medium mb-1">Your Rating</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={i < Math.round(userRating) ? 'text-lg' : 'text-lg opacity-20'}
                      >
                        ⭐
                      </span>
                    ))}
                    <span className="ml-2 font-semibold text-green-700">{userRating}/5</span>
                  </div>
                </div>
              )}

              {/* Rating Stars */}
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-600 mb-2">Rate this store</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRatingChange(store.id, star)}
                      className={`text-2xl transition transform hover:scale-110 ${
                        (isSelected ? selectedRating : userRating) >= star
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              {isSelected && selectedRating > 0 && (
                <button
                  onClick={() => handleSubmit(store.id)}
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                  {submitting ? 'Saving...' : 'Save Rating'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}