"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

const FALLBACK_IMAGE_URL = '/images/placeholder.svg';

export default function AdminGalleryPage() {
  const { data: session, status } = useSession();
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageTitle, setImageTitle] = useState("");
  const [imageTags, setImageTags] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("No file chosen");
  const [editingImage, setEditingImage] = useState(null);
  const [galleryProtectionEnabled, setGalleryProtectionEnabled] = useState(false);
  const [loadingProtection, setLoadingProtection] = useState(true);
  const [savingProtection, setSavingProtection] = useState(false);
  const [protectionMessage, setProtectionMessage] = useState("");

  useEffect(() => {
    fetch("/api/images")
      .then((res) => res.json())
      .then((data) => setImages(Array.isArray(data) ? data : data.images || []))
      .catch((err) => { console.error("Error:", err); setImages([]); });

  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (session?.user?.role !== "admin") {
      setLoadingProtection(false);
      return;
    }

    fetch("/api/admin/home-settings")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load gallery protection setting.");
        return res.json();
      })
      .then((data) => setGalleryProtectionEnabled(Boolean(data.settings?.galleryProtectionEnabled)))
      .catch((error) => {
        console.error("Failed to load gallery protection setting:", error);
        setProtectionMessage("Could not load the current protection setting.");
      })
      .finally(() => setLoadingProtection(false));
  }, [status, session?.user?.role]);

  const updateGalleryProtection = async (enabled) => {
    setSavingProtection(true);
    setProtectionMessage("");
    try {
      const res = await fetch("/api/admin/home-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ galleryProtectionEnabled: enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update gallery protection.");
      setGalleryProtectionEnabled(data.galleryProtectionEnabled);
      setProtectionMessage(data.galleryProtectionEnabled ? "Gallery deterrents enabled." : "Gallery deterrents disabled.");
    } catch (error) {
      console.error("Failed to update gallery protection:", error);
      setProtectionMessage(error.message || "Failed to update gallery protection.");
    } finally {
      setSavingProtection(false);
    }
  };

  const resetImageForm = () => {
    setSelectedFile(null);
    setFileName("No file chosen");
    setImageTitle("");
    setImageTags("");
    setEditingImage(null);
    setUploadError("");
  };

  const editImage = (image) => {
    setEditingImage(image);
    setImageTitle(image.title || "");
    setImageTags(image.tags?.join(', ') || "");
    setSelectedFile(null);
    setFileName("Existing file will be kept unless new one is chosen");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploadError("");
    const isUpdating = editingImage !== null;

    if (!imageTitle) {
      setUploadError("Title is required.");
      return;
    }
    if (!isUpdating && !selectedFile) {
      setUploadError("File is required for new uploads.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("title", imageTitle);
    formData.append("tags", imageTags);
    if (selectedFile) formData.append("image", selectedFile);

    const method = isUpdating ? "PUT" : "POST";
    const url = isUpdating ? `/api/upload?id=${editingImage._id}` : "/api/upload";

    try {
      const res = await fetch(url, { method, body: formData });
      if (!res.ok) throw new Error((await res.json()).message || 'Operation failed');
      const result = await res.json();
      if (isUpdating) {
        setImages((prev) => prev.map(img => (img._id === result.image._id ? result.image : img)));
      } else {
        setImages((prev) => [...prev, result.image]);
      }
      resetImageForm();
    } catch (error) {
      setUploadError(error.message || (isUpdating ? "Failed to update image." : "Failed to upload image."));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm("Delete this image?")) return;
    try {
      const res = await fetch(`/api/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId })
      });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img._id !== imageId));
        if (editingImage?._id === imageId) resetImageForm();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;
  if (status === "unauthenticated" || session?.user?.role !== "admin") return <div className="min-h-screen flex items-center justify-center text-red-500">Access Denied</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-700 dark:text-yellow-400">Manage Gallery</h1>
          <button onClick={() => signOut({ callbackUrl: "/?logout=true" })} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Sign Out</button>
        </div>

        {session?.user?.role === "admin" && <section className="mb-8 rounded-lg border bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start gap-3">
            <input
              id="gallery-protection"
              type="checkbox"
              checked={galleryProtectionEnabled}
              onChange={(event) => updateGalleryProtection(event.target.checked)}
              disabled={loadingProtection || savingProtection}
              className="mt-1 h-4 w-4"
            />
            <div>
              <label htmlFor="gallery-protection" className="font-semibold">Enable gallery image-saving deterrents</label>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                When enabled, visitors cannot open gallery images in a new tab, use the right-click menu, or drag images from the gallery.
                This cannot prevent operating-system screenshots, screen photos, or access through browser developer tools.
              </p>
              {loadingProtection && <p className="mt-2 text-sm">Loading current setting...</p>}
              {protectionMessage && <p role="status" className="mt-2 text-sm">{protectionMessage}</p>}
            </div>
          </div>
        </section>}

        <form onSubmit={handleUpload} className={`mb-8 space-y-4 p-4 border rounded-lg ${editingImage ? 'bg-indigo-50 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`}>
          <h3 className="text-xl font-semibold text-indigo-700 dark:text-yellow-400">{editingImage ? `Editing: ${editingImage.title}` : "Upload New Image"}</h3>
          <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Title" value={imageTitle} onChange={(e) => setImageTitle(e.target.value)} required />
          <input className="border p-2 w-full rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Tags (comma separated)" value={imageTags} onChange={(e) => setImageTags(e.target.value)} />
          <label className="block">
            <input type="file" onChange={(e) => { const file = e.target.files[0]; setSelectedFile(file); setFileName(file ? file.name : "No file chosen"); }} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" accept="image/*" />
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1 block">{fileName}</span>
          </label>
          {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
          <div className="flex gap-4">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50" disabled={uploading}>{uploading ? 'Processing...' : (editingImage ? 'Update Image' : 'Upload Image')}</button>
            {editingImage && (<button type="button" onClick={resetImageForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500" disabled={uploading}>Cancel Edit</button>)}
          </div>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img._id} className={`border rounded-lg overflow-hidden shadow-lg p-2 ${editingImage?._id === img._id ? 'border-4 border-indigo-500' : 'dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
              <div className="relative w-full h-32">
                <Image src={img.url || FALLBACK_IMAGE_URL} alt={img.title} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 50vw, 25vw" className="rounded" />
              </div>
              <div className="pt-2">
                <p className="text-sm font-semibold truncate dark:text-white" title={img.title}>{img.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{img.tags?.join(', ') || 'No Tags'}</p>
                <div className="flex justify-between mt-2">
                  <button onClick={() => editImage(img)} className="text-indigo-500 hover:text-indigo-700 text-xs">Edit</button>
                  <button onClick={() => handleDeleteImage(img._id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
