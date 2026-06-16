import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-2xl text-indigo-200 mb-8">Page Not Found</p>
        <p className="text-indigo-300 mb-8 max-w-md">
          Sorry, the page you're looking for doesn't exist. It might have been
          moved or deleted.
        </p>
        <Link
          to="/"
          className="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
