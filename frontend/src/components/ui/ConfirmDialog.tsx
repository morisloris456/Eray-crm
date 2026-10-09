import { Trash2 } from "lucide-react";
type ConfirmDialogProps = {
    open: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
  };
export default function ConfirmDialog({
    open,
    title = "Confirmation",
    message,
    confirmText = "Supprimer",
    cancelText = "Annuler",
    onConfirm,
    onCancel,
  }: ConfirmDialogProps) {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
  
          {/* ICON DANGER */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
  
          {/* TITLE */}
          <h2 className="text-center text-lg font-bold text-gray-800">
            {title}
          </h2>
  
          {/* MESSAGE */}
          <p className="mt-2 text-center text-sm leading-relaxed text-gray-500">
            {message}
          </p>
  
          {/* ACTIONS */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-2xl bg-gray-100 py-3 text-sm font-bold text-gray-600 hover:bg-gray-200 transition"
            >
              {cancelText}
            </button>
  
            <button
              onClick={onConfirm}
              className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-red-700 transition"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  }