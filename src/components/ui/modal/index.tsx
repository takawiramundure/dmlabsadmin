"use client";

import { useRef, useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  title?: string; // Added title prop
  showCloseButton?: boolean;
  isFullscreen?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full" | "none";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  title,
  showCloseButton = true,
  isFullscreen = false,
  size = "md",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const contentClasses = isFullscreen
    ? "w-full h-full"
    : "relative w-full rounded-3xl bg-white dark:bg-gray-900 max-h-[95vh] mx-auto"; 

  const sizeClasses = {
    sm: "max-w-md w-full",
    md: "max-w-[80vw] w-full",
    lg: "max-w-[85vw] w-full",
    xl: "max-w-[88vw] w-full",
    "2xl": "max-w-[90vw] w-full",
    "5xl": "max-w-[92vw] w-full",
    "7xl": "max-w-[94vw] w-full",
    full: "max-w-[98vw] w-full",
    none: ""
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      {!isFullscreen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />
      )}

      <div
        ref={modalRef}
        className={`${contentClasses} ${!isFullscreen ? sizeClasses[size as keyof typeof sizeClasses] : ''} ${className} flex flex-col shadow-2xl ring-1 ring-black/5`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
