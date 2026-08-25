"use client";

import { useState, useCallback } from "react";

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant?: "danger" | "primary" | "warning";
  confirmLabel?: string;
}

export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "primary",
    confirmLabel: "Confirm",
  });

  const confirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    variant: "danger" | "primary" | "warning" = "primary",
    confirmLabel: string = "Confirm"
  ) => {
    setState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setState((prev) => ({ ...prev, isOpen: false }));
      },
      variant,
      confirmLabel,
    });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    ...state,
    confirm,
    close,
  };
};
