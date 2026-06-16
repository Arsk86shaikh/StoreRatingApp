import { useState, useEffect } from 'react';
import StoreCard from './StoreCard';
import SearchFilter from '../common/SearchFilter';
import Pagination from '../common/Pagination';

export default function StoreList({ stores = [], userRatings = {}, onRatingSubmit, loading = false }) {
  const [filteredStores, setFilteredStores] = useState(stores);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStores(stores);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = stores.filter((store) => 
        store.name.toLowerCase().includes(term) ||
        store.address.toLowerCase().includes(term) ||
        store.email.toLowerCase().includes(term)
      );
      setFilteredStores(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, stores]);

  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedStores = filteredStores.slice(startIdx, endIdx);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No stores available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Filter */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search by Store Name or Address
        </label>
        <SearchFilter 
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search stores..."
        />
        {filteredStores.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredStores.length} store{filteredStores.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Store Grid */}
      {filteredStores.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 text-lg">No stores match your search</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedStores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                userRating={userRatings[store.id]}
                onRatingSubmit={onRatingSubmit}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg font-medium ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
