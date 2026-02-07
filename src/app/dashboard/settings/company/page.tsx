'use client';

import { useState, useEffect } from 'react';
import { Building2, Save, Globe, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SettingsHeader } from '@/components/settings/settings-header';
import { supabase } from '@/lib/supabase';

export default function CompanyPage() {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const companyId = user?.app_metadata?.company_id || user?.user_metadata?.company_id;

            if (companyId) {
                const { data, error } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', companyId)
                    .single();

                if (!error && data) {
                    setName(data.name);
                    setSlug(data.slug);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const companyId = user?.app_metadata?.company_id || user?.user_metadata?.company_id;

            if (companyId) {
                const { error } = await supabase
                    .from('companies')
                    .update({ name, slug })
                    .eq('id', companyId);

                if (error) throw error;
                alert('تم حفظ البيانات بنجاح!');
            }
        } catch (err: any) {
            alert(`خطأ: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-10 w-10 text-brand-green animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[32px] p-8 border-2 border-brand-beige shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/20">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-brand-blue">بيانات المؤسسة</h1>
                        <p className="text-sm text-brand-blue-alt/60 font-bold mt-1">إدارة معلومات الشركة والعلامة التجارية</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[32px] p-10 border-2 border-brand-beige shadow-sm space-y-8">
                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input
                                    label="اسم الشركة / النشاط التجاري"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="مثال: متجر إندكس"
                                    required
                                    className="h-14 rounded-2xl border-2 border-brand-beige focus:border-brand-green transition-all font-bold"
                                />
                                <Input
                                    label="رابط المنصة الخاص بك (Slug)"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="index-store"
                                    required
                                    icon={<Globe className="h-5 w-5 text-brand-blue-alt/30" />}
                                    className="h-14 rounded-2xl border-2 border-brand-beige focus:border-brand-green transition-all font-bold font-number"
                                />
                            </div>

                            <div className="pt-4">
                                <Button type="submit" isLoading={isSaving} className="px-10 font-black gap-3 h-14 bg-brand-green hover:bg-brand-green-alt shadow-xl shadow-brand-green/20 rounded-2xl text-lg transition-all active:scale-95">
                                    <Save className="h-6 w-6" />
                                    حفظ وتعديل البيانات
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white rounded-[32px] p-10 border-2 border-brand-beige shadow-sm space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-brand-green text-white flex items-center justify-center shadow-lg shadow-brand-green/20">
                                <Globe className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-blue">المنصة والروابط</h3>
                        </div>
                        <div className="p-8 rounded-2xl bg-brand-off-white/80 border-2 border-brand-beige space-y-3">
                            <p className="text-[11px] font-black text-brand-blue-alt/50 uppercase tracking-widest">رابط تتبع الطلبات للعملاء</p>
                            <p className="text-brand-green font-black underline cursor-pointer truncate text-lg">
                                https://index-plus.app/track/{slug}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-brand-blue rounded-[32px] p-10 text-white space-y-6 relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <div className="h-14 w-14 rounded-2xl bg-brand-green flex items-center justify-center text-white border-2 border-white/10 shadow-lg mb-6">
                                <Info className="h-7 w-7" />
                            </div>
                            <h4 className="text-xl font-black mb-4">لماذا نطلب هذه البيانات؟</h4>
                            <p className="text-sm text-white/60 font-bold leading-relaxed">
                                نستخدم اسم الشركة في الرسائل التلقائية وفي صفحة تتبع الطلبات الخاصة بعملائك. الرابط الخاص بك (Slug) يساعد عملائك على الوصول إليك بسهولة تامة.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    </div>
                </div>
            </div>
        </div>
    );
}
