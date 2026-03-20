export default function Custom500() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-stone-100 text-center p-6">
      <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
      <p className="text-stone-400 max-w-md">
        An unexpected error occurred while rendering this page. Please refresh or return to the dashboard.
      </p>
    </div>
  );
}
