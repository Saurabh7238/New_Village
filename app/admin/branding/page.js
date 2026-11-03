'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';

const ASSET_FIELDS = [
  {
    key: 'logo',
    title: 'Light theme logo',
    description: 'Used in the site header and light-theme sections. Transparent PNG or SVG is recommended.',
    accept: '.png,.jpg,.jpeg,.webp,.svg',
  },
  {
    key: 'darkLogo',
    title: 'Dark theme logo',
    description: 'Used in the header and footer when dark theme is active. Use artwork with contrast on dark backgrounds.',
    accept: '.png,.jpg,.jpeg,.webp,.svg',
  },
  {
    key: 'favicon',
    title: 'Browser favicon',
    description: 'Shown in browser tabs and bookmarks. Supported formats: .ico, .png, .svg, and .jpg.',
    accept: '.ico,.png,.svg,.jpg,.jpeg',
  },
  {
    key: 'heroImage',
    title: 'Homepage hero background',
    description: 'Background image behind the main welcome message on the homepage.',
    accept: '.png,.jpg,.jpeg,.webp',
  },
];

export default function BrandingManagerPage() {
  const { data: session, status } = useSession();
  const [assets, setAssets] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const loadAssets = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/branding-assets', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to load site media.');
      }
      setAssets(data.assets || {});
    } catch (error) {
      console.error('Failed to load site branding media:', error);
      setMessage(error.message || 'Unable to load site media.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') loadAssets();
    if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
      setLoading(false);
    }
  }, [loadAssets, session?.user?.role, status]);

  const uploadAsset = async (key) => {
    const file = selectedFiles[key];
    if (!file) {
      setMessage('Choose a file before uploading.');
      setMessageType('error');
      return;
    }

    setBusyKey(key);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('key', key);
      formData.append('file', file);

      const response = await fetch('/api/admin/branding-assets', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Upload failed.');
      }

      setAssets((current) => ({ ...current, [key]: data.asset }));
      window.dispatchEvent(new CustomEvent('site-branding-updated', { detail: { key, asset: data.asset } }));
      setSelectedFiles((current) => ({ ...current, [key]: null }));
      setMessage(`${ASSET_FIELDS.find((field) => field.key === key)?.title} updated successfully.`);
      setMessageType('success');
    } catch (error) {
      console.error('Failed to upload site branding media:', error);
      setMessage(error.message || 'Upload failed.');
      setMessageType('error');
    } finally {
      setBusyKey('');
    }
  };

  const removeAsset = async (key) => {
    const field = ASSET_FIELDS.find((item) => item.key === key);
    if (!window.confirm(`Remove the current ${field?.title.toLowerCase()}?`)) return;

    setBusyKey(key);
    setMessage('');
    try {
      const response = await fetch('/api/admin/branding-assets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to remove the media.');
      }

      setAssets((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      window.dispatchEvent(new CustomEvent('site-branding-updated', { detail: { key, asset: null } }));
      setMessage(`${field?.title} removed. The site default will be used.`);
      setMessageType('success');
    } catch (error) {
      console.error('Failed to remove site branding media:', error);
      setMessage(error.message || 'Unable to remove the media.');
      setMessageType('error');
    } finally {
      setBusyKey('');
    }
  };

  if (status === 'loading') return <div className="p-8 text-center">Loading...</div>;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    return <div className="flex min-h-[50vh] items-center justify-center text-red-600">Admin access required.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">Site media manager</p>
          <h1 className="mt-1 text-3xl font-extrabold">Logo, favicon &amp; hero image</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Upload and manage the images used by the public website. Changes take effect after upload.
          </p>
        </div>
        <Link href="/admin" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
          Back to Admin
        </Link>
      </header>

      {message && (
        <p role={messageType === 'error' ? 'alert' : 'status'} className={`rounded-lg px-4 py-3 text-sm ${
          messageType === 'error'
            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
        }`}>
          {message}
        </p>
      )}

      {loading ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          Loading site media...
        </p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {ASSET_FIELDS.map((field) => {
            const asset = assets[field.key];
            const file = selectedFiles[field.key];
            const isBusy = busyKey === field.key;
            const previewClass = field.key === 'heroImage'
              ? 'h-48 w-full'
              : 'h-32 w-full';

            return (
              <section key={field.key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <span className="rounded-lg bg-teal-100 p-2 text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                    <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-bold">{field.title}</h2>
                    <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{field.description}</p>
                  </div>
                </div>

                <div className={`mt-4 flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800 ${previewClass}`}>
                  {asset?.url ? (
                    <Image
                      key={asset.url}
                      src={asset.url}
                      alt={`${field.title} preview`}
                      width={field.key === 'heroImage' ? 800 : 400}
                      height={field.key === 'heroImage' ? 240 : 160}
                      unoptimized
                      className={field.key === 'heroImage' ? 'h-full w-full object-cover' : 'max-h-full max-w-full object-contain'}
                    />
                  ) : (
                    <span className="text-sm text-slate-500">Using the site default</span>
                  )}
                </div>

                {asset?.fileName && (
                  <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400" title={asset.fileName}>
                    Current file: {asset.fileName}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Choose file
                    <input
                      type="file"
                      accept={field.accept}
                      className="sr-only"
                      onChange={(event) => {
                        const selected = event.target.files?.[0] || null;
                        setSelectedFiles((current) => ({ ...current, [field.key]: selected }));
                        event.target.value = '';
                      }}
                    />
                  </label>
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-500">
                    {file?.name || 'No new file selected'}
                  </span>
                  <button
                    type="button"
                    onClick={() => uploadAsset(field.key)}
                    disabled={!file || isBusy}
                    className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBusy ? 'Saving...' : 'Upload & apply'}
                  </button>
                  {asset && (
                    <button
                      type="button"
                      onClick={() => removeAsset(field.key)}
                      disabled={isBusy}
                      aria-label={`Remove ${field.title}`}
                      className="rounded-lg border border-red-300 p-2 text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
        Upload limits: logo 1 MB each, favicon 512 KB, hero image 4 MB. SVG files are checked to reject scripts and external references.
      </p>
    </div>
  );
}
