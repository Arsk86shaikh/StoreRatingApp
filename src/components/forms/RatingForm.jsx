import { useState, useEffect } from 'react';

export default function RatingForm({ storeId, initialRating = null, onSubmit, loading = false }) {
  const [error, setError] = useState('');
  const [rating, setRating] = useState(initialRating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (initialRating) {
      setRating(initialRating);
    }
  }, [initialRating]);

  const validateForm = () => {
    if (rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit({ storeId, rating: parseInt(rating) });
    } catch (err) {
      setError(err.message || 'Failed to submit rating');
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const value = index + 1;
      return (
        <button
          key={value}
          type="button"
          onClick={() => {
            setRating(value);
            setError('');
          }}
          onMouseEnter={() => setHoverRating(value)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none transition"
        >
          <span
            className={`text-4xl ${
              value <= (hoverRating || rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            }`}
          >
            ★
          </span>
        </button>
      );
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Rate this Store (1-5 Stars)
        </label>
        <div className="flex gap-2 justify-center py-4">
          {renderStars()}
        </div>
        {rating > 0 && (
          <p className="text-center text-lg font-semibold text-indigo-600">
            {rating} out of 5 stars
          </p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
      >
        {loading ? 'Submitting...' : initialRating ? 'Update Rating' : 'Submit Rating'}
      </button>
    </form>
  );
}
