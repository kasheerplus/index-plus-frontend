'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const COMMON_EMOJIS = [
    '😊', '😂', '🥰', '😍', '😒', '😘', '😩', '😭', '😎', '😉',
    '👍', '👎', '👌', '✌️', '💪', '🙏', '👏', '🙌', '🎉', '✨',
    '❤️', '💙', '💚', '💛', '💜', '💔', '🌹', '💐', '🎁', '🎂',
    '✅', '❌', '❓', '❗', '💯', '💰', '💸', '💵', '💳', '🛒',
    '📍', '👀', '👋', '👊', '🔥', '⭐', '🌟', '🌙', '☀️', '⚡',
    '🍎', '🍕', '🍔', '🍺', '☕', '⚽', '🏀', '🎮', '🚗', '✈️'
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
    return (
        <div className="absolute bottom-12 left-0 z-50 p-2 bg-white rounded-2xl shadow-xl border border-brand-beige w-64 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-brand-beige/50">
                <span className="text-[10px] font-black text-brand-blue-alt/50 uppercase">اختر رمزاً تعبيرياً</span>
                <button onClick={onClose} className="text-brand-blue-alt/40 hover:text-red-500 transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto custom-scrollbar p-1">
                {COMMON_EMOJIS.map((emoji, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            onSelect(emoji);
                            // Optional: Keep open or close after selection
                        }}
                        className="h-8 w-8 flex items-center justify-center text-lg hover:bg-brand-off-white rounded-lg transition-colors hover:scale-110"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
