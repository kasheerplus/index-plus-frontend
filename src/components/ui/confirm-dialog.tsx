'use client';

import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    variant = 'warning',
    onConfirm,
    onCancel
}: ConfirmDialogProps) {
    const colors = {
        danger: 'bg-red-500',
        warning: 'bg-amber-500',
        info: 'bg-blue-500'
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-cairo" onClick={onCancel}>
            <div
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="confirm-dialog-title"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white ${colors[variant]}`}>
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <h2 id="confirm-dialog-title" className="text-2xl font-black text-navy">{title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        aria-label="إغلاق"
                    >
                        <X className="h-5 w-5 text-gray-400" />
                    </button>
                </div>

                <p className="text-sm text-gray-600 font-bold mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1 h-12 font-black"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className={`flex-1 h-12 font-black ${variant === 'danger' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
