import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">403</h1>
        <p className="text-2xl text-red-200 mb-8">Access Denied</p>
        <p className="text-red-300 mb-8 max-w-md">
          You don't have permission to access this resource. Please contact an
          administrator if you believe this is an error.
        </p>
        <Link
          to="/"
          className="inline-block bg-white text-red-600 px-6 py-3 rounded-lg font-medium hover:bg-red-50 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
