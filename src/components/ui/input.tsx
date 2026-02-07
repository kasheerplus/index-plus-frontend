import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, icon, id, ...props }, ref) => {
        const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="text-[10px] font-black text-gray-400 uppercase mb-2 block"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-4 text-gray-400">
                            {icon}
                        </div>
                    )}
                    <input
                        id={inputId}
                        type={type}
                        className={cn(
                            "flex h-11 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all disabled:cursor-not-allowed disabled:opacity-50 font-bold text-navy",
                            icon && "pr-11",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
