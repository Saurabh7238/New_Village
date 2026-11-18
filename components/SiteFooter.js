'use client';

import Image from 'next/image';
import { useLanguage } from '@/app/language-provider';
import { useSiteSettings } from '@/app/site-settings-provider';

export default function SiteFooter() {
  const { villageName, villageNameHindi, branding } = useSiteSettings();
  const { language, labels } = useLanguage();

  const lightLogo = branding.logo?.url || '/favicon.png';
  const darkLogo = branding.darkLogo?.url || lightLogo;
  const localizedVillageName = language === 'hi' ? villageNameHindi || villageName : villageName;

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 py-5 text-center text-sm">
        <span className="relative h-9 w-9 shrink-0">
          <Image src={lightLogo} alt="" fill sizes="36px" unoptimized className="object-contain dark:hidden" />
          <Image src={darkLogo} alt="" fill sizes="36px" unoptimized className="hidden object-contain dark:block" />
        </span>
        <span>© {new Date().getFullYear()} {labels.gramPanchayat} {localizedVillageName}</span>
      </div>
    </footer>
  );
}
