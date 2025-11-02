export default function Footer() {
  return (
    <footer className="relative mt-auto">
      {/* Separador visual con gradiente */}
      <div className="h-px bg-gradient-to-r from-transparent via-border-medium to-transparent mb-8"></div>
      
      <div className="bg-card/30 backdrop-blur-sm border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Contenido principal del footer */}
          <div className="grid md:grid-cols-3 gap-6 items-center">
            
            {/* Logo y descripción */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AT</span>
                </div>
                <span className="font-semibold text-lg text-text-primary">Atreu Temperature</span>
              </div>
              <p className="text-text-secondary text-sm">
                Sistema de monitoreo para túneles de refrigeración
              </p>
            </div>

            {/* Información del sistema */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600/10 border border-brand-600/20 rounded-full">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-brand-300">Sistema Operativo</span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                La Hornilla - Monitoreo en tiempo real
              </p>
            </div>

            {/* Copyright y año */}
            <div className="text-center md:text-right">
              <p className="text-text-secondary font-medium mb-1">
                © 2025 Atreu Temperature
              </p>
              <p className="text-text-muted text-xs">
                Desarrollado para La Hornilla
              </p>
            </div>
          </div>

          {/* Línea inferior con versión */}
          <div className="mt-6 pt-4 border-t border-border-subtle">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <p className="text-xs text-text-muted">
                Atreu Temperature System v1.0.0
              </p>
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <span>Temperatura</span>
                <span>Monitoreo</span>
                <span>Alertas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
