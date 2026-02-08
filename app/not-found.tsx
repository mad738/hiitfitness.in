import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-stone-100 flex flex-col items-center justify-center px-4">
      <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-stone-100 mb-2">
        Page not found
      </h1>
      <p className="text-stone-400 text-sm mb-6 text-center">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link
        href="/"
        className="font-semibold text-brand-red hover:underline text-sm"
      >
        Back to home
      </Link>
    </div>
  );
}
