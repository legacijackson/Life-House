import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => setLocation("/")}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
