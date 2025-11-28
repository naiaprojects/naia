// app/briefing/loading.js
export default function Loading() {
  // Anda bisa membuat spinner yang lebih menarik jika mau
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4">Memuat formulir...</p>
      </div>
    </div>
  );
}