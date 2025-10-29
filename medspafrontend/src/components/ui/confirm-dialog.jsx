"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

/**
 * Non-blocking Confirm Dialog Component
 * Provides async confirmation flow with accessibility support
 */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel }) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook to use confirm dialog
 * Returns a promise-based confirm function
 */
export function useConfirm() {
  const [open, setOpen] = React.useState(false);
  const [config, setConfig] = React.useState(null);
  const [resolve, setResolve] = React.useState(null);

  const confirm = React.useCallback(
    (options) => {
      return new Promise((res) => {
        setConfig(options);
        setOpen(true);
        setResolve(() => res);
      });
    },
    []
  );

  const handleConfirm = React.useCallback(() => {
    resolve?.(true);
    setResolve(null);
    setConfig(null);
    setOpen(false);
  }, [resolve]);

  const handleCancel = React.useCallback(() => {
    resolve?.(false);
    setResolve(null);
    setConfig(null);
    setOpen(false);
  }, [resolve]);

  return {
    confirm,
    dialog: config && (
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={config.title}
        description={config.description}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
  };
}

