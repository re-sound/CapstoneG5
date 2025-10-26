// src/components/Modal.tsx
import { PropsWithChildren, useEffect } from "react";
import { createPortal } from "react-dom";
import React from "react";

type ModalProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  maxWidth?: string; // ej. "max-w-6xl"
};

class ModalErrorBoundary extends React.Component<
  PropsWithChildren,
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any) {
    // opcional: console.log(error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 text-sm text-rose-300">
          Ocurrió un error al renderizar el contenido. <br />
          <span className="text-rose-400/80">
            Revisa el componente hijo (por ejemplo, TunnelDetail).
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Modal({
  open,
  title,
  onClose,
  maxWidth = "max-w-6xl",
  children,
}: PropsWithChildren<ModalProps>) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onEsc);
      // evitar scroll del body cuando está abierta
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const node = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
      onMouseDown={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`w-full ${maxWidth} mt-10 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700`}
        onMouseDown={(e) => e.stopPropagation()} // importante: que no se cierre al click dentro
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 sticky top-0 bg-slate-800 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <ModalErrorBoundary>{children}</ModalErrorBoundary>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}
