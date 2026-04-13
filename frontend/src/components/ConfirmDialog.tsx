import { useState, useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [exiting, setExiting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setExiting(false);
  }, [open]);

  const handleCancel = () => {
    setExiting(true);
    setTimeout(onCancel, 200);
  };

  const handleConfirm = () => {
    setExiting(true);
    setTimeout(onConfirm, 200);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className={`confirm-overlay ${exiting ? "confirm-exit" : "confirm-enter"}`} onClick={handleCancel}>
      <div
        className={`confirm-dialog confirm-${variant}`}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-header">
          <span className="confirm-icon">
            {variant === "danger" ? "🗑️" : variant === "warning" ? "⚠️" : "ℹ️"}
          </span>
          <h3>{title}</h3>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={handleCancel}>
            {cancelText}
          </button>
          <button className={`btn-primary btn-confirm-${variant}`} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
