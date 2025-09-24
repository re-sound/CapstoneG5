export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-card text-on flex flex-col focus-brand">
      {children}
    </div>
  );
}
