"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { DEFAULT_VILLAGE_PROFILE } from "@/lib/villageProfile";

const villageProfileSections = [
  {
    title: "Population and services",
    fields: [
      ["population", "Total population"],
      ["censusYear", "Population census year"],
      ["malePopulation", "Male population"],
      ["femalePopulation", "Female population"],
      ["households", "Households"],
      ["householdCode", "Household code"],
      ["schools", "Schools"],
      ["wardMembers", "Ward members"],
    ],
  },
  {
    title: "Location and Gram Pradhan",
    fields: [
      ["state", "State"],
      ["district", "District"],
      ["block", "Block"],
      ["villagesServed", "Villages served (comma separated)"],
      ["gramPradhanName", "Gram Pradhan name"],
      ["gramPradhanTerm", "Gram Pradhan role / term"],
      ["villageDescription", "Village description (English)", true],
      ["villageDescriptionHindi", "गांव का परिचय (हिंदी)", true],
    ],
  },
  {
    title: "Representatives and governance",
    fields: [
      ["assembly", "Assembly constituency"],
      ["parliament", "Parliament constituency"],
      ["subDistrict", "Sub-district / tehsil"],
      ["mla", "MLA name and party"],
      ["mp", "MP name and party"],
    ],
  },
  {
    title: "Culture and postal details",
    fields: [
      ["templeName", "Temple / landmark"],
      ["templeDescription", "Temple description (English)", true],
      ["templeDescriptionHindi", "मंदिर का परिचय (हिंदी)", true],
      ["beliefsDescription", "Beliefs and customs (English)", true],
      ["beliefsDescriptionHindi", "विश्वास और परंपराएं (हिंदी)", true],
      ["traditionalDress", "Traditional dress"],
      ["traditionalFood", "Traditional food"],
      ["traditionalOrnaments", "Traditional ornaments"],
      ["pincode", "PIN code"],
      ["postalAreaCode", "Postal area code"],
    ],
  },
];

const defaultSlides = [
  {
    title: "Village Services",
    imageUrl: "/slide.png",
    alt: "Village services banner",
    href: "/grievance",
  },
  {
    title: "Voter Services",
    imageUrl: "/voter.png",
    alt: "Voter services banner",
    href: "/voter",
  },
  {
    title: "Panchayat Campus",
    imageUrl: "/panchayat.jpg",
    alt: "Panchayat campus banner",
    href: "/about",
  },
];

export default function HomeManagementPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [formData, setFormData] = useState({
    villageName: "Chiutahara",
    villageNameHindi: "चिउटहरा",
    villageProfile: DEFAULT_VILLAGE_PROFILE,
    sloganEnabled: true,
    slogan: "Panchayat Vikas, Sarvajan Sukhaya 🌞 | Efficient Governance for Every Citizen",
    sloganHindi: "पंचायत विकास, सर्वजन सुखाय 🌞 | Efficient Governance For Every Citizen",
    popupEnabled: true,
    popupTitle: "Important Update",
    popupMessage: "Gram Sabha will be held on the scheduled date at the Panchayat Bhavan.",
    popupLink: "",
    slides: defaultSlides,
  });

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "admin") return;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/home-settings");
        const data = await res.json();
        if (res.ok && data.settings) {
          setFormData({
            villageName: data.settings.villageName || "Chiutahara",
            villageNameHindi: data.settings.villageNameHindi || "चिउटहरा",
            villageProfile: {
              ...DEFAULT_VILLAGE_PROFILE,
              ...(data.settings.villageProfile || {}),
            },
            sloganEnabled: data.settings.sloganEnabled !== false,
            slogan: data.settings.slogan || "Panchayat Vikas, Sarvajan Sukhaya 🌞 | Efficient Governance for Every Citizen",
            sloganHindi: data.settings.sloganHindi || "पंचायत विकास, सर्वजन सुखाय 🌞 | Efficient Governance For Every Citizen",
            popupEnabled: Boolean(data.settings.popupEnabled),
            popupTitle: data.settings.popupTitle || "Important Update",
            popupMessage: data.settings.popupMessage || "",
            popupLink: data.settings.popupLink || "",
            slides: Array.isArray(data.settings.slides) && data.settings.slides.length
              ? data.settings.slides
              : defaultSlides,
          });
        }
      } catch (error) {
        console.error("Failed to fetch home settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [status, session?.user?.role]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateVillageProfile = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      villageProfile: { ...prev.villageProfile, [field]: value },
    }));
  };

  const updateSlide = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      slides: prev.slides.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide
      ),
    }));
  };

  const addSlide = () => {
    setFormData((prev) => ({
      ...prev,
      slides: [...prev.slides, { title: "New Slide", imageUrl: "/slide.png", alt: "", href: "" }],
    }));
  };

  const removeSlide = (index) => {
    setFormData((prev) => ({
      ...prev,
      slides: prev.slides.filter((_, slideIndex) => slideIndex !== index),
    }));
  };

  const uploadSlideImage = async (index, file) => {
    if (!file) return;

    const title = `${formData.slides[index]?.title || "Slide"} ${index + 1}`;
    const formDataToSend = new FormData();
    formDataToSend.append("title", title);
    formDataToSend.append("image", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Image upload failed");
      }

      const uploadedImage = data.image?.image_data || data.image?.url || "";
      if (uploadedImage) {
        updateSlide(index, "imageUrl", uploadedImage);
        setMessage("Image uploaded successfully.");
        setMessageType("success");
      }
    } catch (error) {
      console.error("Upload slide image failed:", error);
      setMessage(error.message || "Image upload failed.");
      setMessageType("error");
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/home-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save homepage settings");
      }

      setMessage("Village name and homepage settings saved successfully.");
      setMessageType("success");
      window.dispatchEvent(new CustomEvent("site-settings-updated", { detail: data.settings }));
    } catch (error) {
      console.error("Save failed:", error);
      setMessage(error.message || "Unable to save homepage settings.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") return <div className="p-8 text-center">Loading...</div>;

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 text-red-500">
        Access Denied. You must be an admin to view this page.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">Home Page Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Manage village information, popup notifications, and homepage slides.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 rounded bg-slate-700 text-white hover:bg-slate-800">
            Back to Admin
          </Link>
        </div>

        {message && (
          <div className={`rounded px-4 py-3 text-sm ${messageType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold mb-2">Village Name</h2>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            These names update the public site header, homepage, footer, page metadata, and PWA install name.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="villageName" className="block text-sm font-medium mb-1">Village name (English)</label>
              <input
                id="villageName"
                type="text"
                maxLength={80}
                required
                value={formData.villageName}
                onChange={(e) => updateField("villageName", e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="villageNameHindi" className="block text-sm font-medium mb-1">गांव का नाम (हिंदी)</label>
              <input
                id="villageNameHindi"
                type="text"
                maxLength={80}
                required
                value={formData.villageNameHindi}
                onChange={(e) => updateField("villageNameHindi", e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold mb-2">Homepage Village Information</h2>
          <p className="mb-5 text-sm text-gray-600 dark:text-gray-300">
            Edit the facts and figures displayed in the homepage village section. The Gram Pradhan name and role are optional; only publish details approved for public display.
          </p>
          <div className="space-y-6">
            {villageProfileSections.map((section) => (
              <section key={section.title}>
                <h3 className="mb-3 border-b border-gray-200 pb-2 text-lg font-semibold dark:border-gray-700">{section.title}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {section.fields.map(([field, label, multiline]) => (
                    <div key={field}>
                      <label htmlFor={`villageProfile-${field}`} className="mb-1 block text-sm font-medium">{label}</label>
                      {multiline ? (
                        <textarea
                          id={`villageProfile-${field}`}
                          rows={3}
                          maxLength={500}
                          value={formData.villageProfile[field] || ""}
                          onChange={(event) => updateVillageProfile(field, event.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <input
                          id={`villageProfile-${field}`}
                          type="text"
                          maxLength={500}
                          value={formData.villageProfile[field] || ""}
                          onChange={(event) => updateVillageProfile(field, event.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Homepage Slogan</h2>
          <div className="mb-4 flex items-center gap-3">
            <input
              id="sloganEnabled"
              type="checkbox"
              checked={formData.sloganEnabled}
              onChange={(event) => updateField("sloganEnabled", event.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="sloganEnabled" className="font-medium">Show scrolling slogan on homepage</label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="slogan" className="mb-1 block text-sm font-medium">Slogan (English)</label>
              <input
                id="slogan"
                type="text"
                maxLength={240}
                value={formData.slogan}
                onChange={(event) => updateField("slogan", event.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="sloganHindi" className="mb-1 block text-sm font-medium">नारा (हिंदी)</label>
              <input
                id="sloganHindi"
                type="text"
                maxLength={240}
                value={formData.sloganHindi}
                onChange={(event) => updateField("sloganHindi", event.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Popup Notification</h2>

          <div className="flex items-center gap-3 mb-4">
            <input
              id="popupEnabled"
              type="checkbox"
              checked={formData.popupEnabled}
              onChange={(e) => updateField("popupEnabled", e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="popupEnabled" className="font-medium">Enable popup banner</label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Popup Title</label>
              <input
                type="text"
                value={formData.popupTitle}
                onChange={(e) => updateField("popupTitle", e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Popup Link</label>
              <input
                type="text"
                value={formData.popupLink}
                onChange={(e) => updateField("popupLink", e.target.value)}
                placeholder="/notifications or https://..."
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Popup Message</label>
            <textarea
              rows={4}
              value={formData.popupMessage}
              onChange={(e) => updateField("popupMessage", e.target.value)}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Homepage Slides</h2>
            <button
              type="button"
              onClick={addSlide}
              className="bg-emerald-600 text-white px-3 py-2 rounded hover:bg-emerald-700"
            >
              Add Slide
            </button>
          </div>

          <div className="space-y-5">
            {formData.slides.map((slide, index) => (
              <div key={`${slide.imageUrl}-${index}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Slide {index + 1}</h3>
                  {formData.slides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlide(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={slide.title || ""}
                      onChange={(e) => updateSlide(index, "title", e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Link</label>
                    <input
                      type="text"
                      value={slide.href || ""}
                      onChange={(e) => updateSlide(index, "href", e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Image URL or Upload</label>
                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        type="text"
                        value={slide.imageUrl || ""}
                        onChange={(e) => updateSlide(index, "imageUrl", e.target.value)}
                        placeholder="Use a direct URL or upload a file"
                        className="flex-1 rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <label className="inline-flex cursor-pointer items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                        Choose from Device Gallery
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => uploadSlideImage(index, e.target.files?.[0])}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Alt Text</label>
                    <input
                      type="text"
                      value={slide.alt || ""}
                      onChange={(e) => updateSlide(index, "alt", e.target.value)}
                      className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={saveSettings}
              disabled={saving || loading}
              className="rounded bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
