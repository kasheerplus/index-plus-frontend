'use client';

import { useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function FacebookCallbackPage() {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (code) {
            // Send the code back to the parent window
            if (window.opener) {
                window.opener.postMessage({ status: 'success', code }, '*');
                // The parent will handle closing the window after processing
            }
        } else if (error) {
            if (window.opener) {
                window.opener.postMessage({ status: 'error', error }, '*');
                window.close();
            }
        }
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#F0F2F5] font-cairo">
            <div className="bg-white p-10 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center">
                        <Loader2 className="h-10 w-10 text-[#1877F2] animate-spin" />
                    </div>
                </div>
                <h1 className="text-xl font-black text-[#1C1E21]">جاري التحقق من الهوية...</h1>
                <p className="text-sm text-[#606770] leading-relaxed">
                    من فضلك انتظر لحظة بينما نقوم بتأمين اتصالك بحساب فيسبوك.
                </p>
                <div className="pt-4 flex items-center gap-2 justify-center text-[10px] text-[#90949C]">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>تم استلام الرمز بنجاح</span>
                </div>
            </div>
        </div>
    );
}
