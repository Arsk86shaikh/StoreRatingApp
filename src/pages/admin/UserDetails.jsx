import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export default function UserDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRatings, setUserRatings] = useState([]);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Fetch user ratings if store owner
      if (userData.role === 'store_owner') {
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_id', userId)
          .single();

        if (storeData) {
          const { data: ratingsData } = await supabase
            .from('ratings')
            .select(`
              id,
              rating,
              created_at,
              users(name)
            `)
            .eq('store_id', storeData.id);

          setUserRatings(ratingsData || []);
        }
      } else if (userData.role === 'user') {
        // Fetch ratings submitted by user
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select(`
            id,
            rating,
            created_at,
            stores(name)
          `)
          .eq('user_id', userId);

        setUserRatings(ratingsData || []);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
        User not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/users')}
          className="text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Users
        </button>
      </div>

      {/* User Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{user.name}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 font-medium">Email</p>
            <p className="text-lg font-semibold text-gray-900">{user.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-medium">Role</p>
            <p className={`text-lg font-semibold ${
              user.role === 'admin' ? 'text-red-600' :
              user.role === 'store_owner' ? 'text-purple-600' :
              'text-blue-600'
            }`}>
              {user.role === 'store_owner' ? 'Store Owner' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-sm text-gray-600 font-medium">Address</p>
            <p className="text-lg font-semibold text-gray-900">{user.address}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-medium">Member Since</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 font-medium">Last Updated</p>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(user.updated_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Ratings Information */}
      {userRatings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {user.role === 'store_owner' ? 'Store Ratings' : 'Submitted Ratings'}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    {user.role === 'store_owner' ? 'Rated By' : 'Store'}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Rating</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userRatings.map((rating) => (
                  <tr key={rating.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.role === 'store_owner'
                        ? rating.users?.name || 'Anonymous'
                        : rating.stores?.name || 'Unknown Store'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
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
                        <span className="ml-2 font-bold text-gray-900">{rating.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
