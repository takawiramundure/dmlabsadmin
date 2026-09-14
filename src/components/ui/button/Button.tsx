"use client";

import { ReactNode } from "react";

import { useAuth } from "@/context/AuthContext";

interface ButtonProps {
  children: ReactNode;
  size?: "sm" | "md";
  variant?: "primary" | "outline" | "secondary";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;       // Shows a spinner / disables while loading
  className?: string;
  type?: "button" | "submit" | "reset";
  id?: string;
  'aria-label'?: string;
  requireSuperAdmin?: boolean; // Hides button if user is not super_admin
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  loading = false,
  type = "button",
  id,
  'aria-label': ariaLabel,
  requireSuperAdmin = false,
}) => {
  const { profile } = useAuth();

  // Return null if this button requires super_admin but the user is not one
  if (requireSuperAdmin && profile?.role !== 'super_admin') {
    return null;
  }

  // Size Classes
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
  };

  // Variant Classes
  const variantClasses = {
    primary:
      "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300",
    secondary:
      "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/20",
  };

  return (
    <button
      id={id}
      type={type}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${sizeClasses[size]
        } ${variantClasses[variant]} ${(disabled || loading) ? "cursor-not-allowed opacity-50" : ""
        }`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {loading ? <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : children}
      {!loading && endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
