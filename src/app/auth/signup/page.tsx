import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-green to-brand-green-alt overflow-hidden">
            <div className="w-full max-w-md bg-white p-8 rounded-[30px] shadow-2xl border-2 border-brand-beige relative overflow-hidden animate-fade-in">
                <SignupForm />
            </div>
        </div>
    );
}
