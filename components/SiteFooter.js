'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSiteSettings } from '@/app/site-settings-provider';

export default function SiteFooter() {
  const { villageName } = useSiteSettings();
  const [branding, setBranding] = useState({});

  useEffect(() => {
    let active = true;
    fetch('/api/admin/home-settings', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load footer branding.');
        return response.json();
      })
      .then((data) => {
        if (active) setBranding(data.settings?.branding || {});
      })
      .catch((error) => console.error('Failed to load footer branding:', error));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleBrandingUpdate = (event) => {
      const { key, asset } = event.detail || {};
      if (!key) return;
      setBranding((current) => ({ ...current, [key]: asset }));
    };
    window.addEventListener('site-branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('site-branding-updated', handleBrandingUpdate);
  }, []);

  const lightLogo = branding.logo?.url || '/favicon.png';
  const darkLogo = branding.darkLogo?.url || lightLogo;

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 py-5 text-center text-sm">
        <span className="relative h-9 w-9 shrink-0">
          <Image src={lightLogo} alt="" fill sizes="36px" unoptimized className="object-contain dark:hidden" />
          <Image src={darkLogo} alt="" fill sizes="36px" unoptimized className="hidden object-contain dark:block" />
        </span>
        <span>© {new Date().getFullYear()} Gram Panchayat {villageName}</span>
      </div>
    </footer>
  );
}
