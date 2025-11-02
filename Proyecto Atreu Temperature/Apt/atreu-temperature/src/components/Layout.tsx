export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen app-bg text-text-primary flex flex-col focus-brand relative overflow-x-hidden">
      
      {/* Efectos visuales de fondo */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradientes sutiles */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-brand-400/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Líneas de diseño sutiles */}
        <div className="absolute top-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-subtle/50 to-transparent"></div>
        <div className="absolute bottom-40 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border-subtle/30 to-transparent"></div>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
