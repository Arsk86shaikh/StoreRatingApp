import { useState } from 'react';
import RatingForm from '../forms/RatingForm';

export default function StoreCard({ store, userRating, onRatingSubmit, showRatingForm = false }) {
  const [showForm, setShowForm] = useState(showRatingForm);

  const handleRatingSubmit = async (data) => {
    await onRatingSubmit(data);
    setShowForm(false);
  };

  const averageRating = store.average_rating || 0;
  const ratingCount = store.rating_count || 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="p-6">
        {/* Store Header */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {store.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Email:</span> {store.email}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Address:</span> {store.address}
          </p>
        </div>

        {/* Rating Section */}
        <div className="border-t pt-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-yellow-400 text-xl">★</span>
                <span className="font-bold text-lg text-gray-900">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-600">
                  ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
                </span>
              </div>
            </div>
          </div>

          {/* User's Rating */}
          {userRating && (
            <div className="bg-blue-50 p-3 rounded mb-3">
              <p className="text-xs text-gray-600 mb-1">Your Rating:</p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < userRating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
            >
              {userRating ? 'Update Rating' : 'Rate Store'}
            </button>
          ) : (
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition font-medium text-sm"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Rating Form */}
        {showForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <RatingForm
              storeId={store.id}
              initialRating={userRating}
              onSubmit={handleRatingSubmit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
