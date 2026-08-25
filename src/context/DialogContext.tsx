"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

interface DialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger" | "warning" | "success";
}

interface DialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: Omit<DialogOptions, "cancelLabel">) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions & { isAlert?: boolean }>({
    title: "",
    message: "",
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: DialogOptions): Promise<boolean> => {
    setOptions({ ...opts, isAlert: false });
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const alert = useCallback((opts: Omit<DialogOptions, "cancelLabel">): Promise<void> => {
    setOptions({ ...opts, isAlert: true });
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolvePromise(() => (val: boolean) => resolve());
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise) resolvePromise(false);
  };

  const variantIcons = {
    primary: <Info className="w-12 h-12 text-brand-500" />,
    danger: <XCircle className="w-12 h-12 text-red-500" />,
    warning: <AlertCircle className="w-12 h-12 text-yellow-500" />,
    success: <CheckCircle2 className="w-12 h-12 text-green-500" />,
  };

  const variantButtonClasses = {
    primary: "bg-brand-500 hover:bg-brand-600 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <Modal 
        isOpen={isOpen} 
        onClose={handleCancel} 
        title={options.title}
        size="sm"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="mb-2">
            {variantIcons[options.variant || "primary"]}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {options.message}
          </p>
          <div className="flex w-full gap-3 mt-6">
            {!options.isAlert && (
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                {options.cancelLabel || "Cancel"}
              </Button>
            )}
            <Button 
              onClick={handleConfirm} 
              className={`flex-1 ${variantButtonClasses[options.variant || "primary"]}`}
            >
              {options.confirmLabel || "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
