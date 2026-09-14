"use client";

import React from "react";
import { Modal } from "./index";
import Button from "../button/Button";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  loading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
}) => {
  const variantClasses = {
    danger: "bg-red-600 hover:bg-red-700 text-white",
    primary: "bg-brand-500 hover:bg-brand-600 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={loading}
            className={variantClasses[variant]}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
