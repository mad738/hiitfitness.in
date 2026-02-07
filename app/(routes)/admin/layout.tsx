export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-stone-100 antialiased">
      {children}
    </div>
  );
}
