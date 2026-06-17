export default function UserRatingsTable({ ratings }) {
  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No ratings yet. Start rating stores!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Store Name
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Address
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Rating
            </th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {ratings.map((rating) => (
            <tr key={rating.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {rating.stores?.name || 'Unknown Store'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {rating.stores?.address || 'N/A'}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{'⭐'.repeat(Math.round(rating.rating))}</span>
                  <span className="font-semibold text-gray-900">{rating.rating}/5</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(rating.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}