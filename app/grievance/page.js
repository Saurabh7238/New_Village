"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "@/app/theme-provider";
import { QUERY_CATEGORIES } from "@/lib/queryDisplay";
export default function GrievancePage() {
  const router = useRouter();
  const { status } = useSession();
  const { isDark } = useTheme();
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [queryId, setQueryId] = useState("");
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: "" });
  const [captchaCorrect, setCaptchaCorrect] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", mobile: "", ward: "", category: "Water", subject: "", description: "", address: "", photo: null });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [loginRequired, setLoginRequired] = useState(false);
  const bgClass = isDark ? "bg-gray-800" : "bg-white";
  const textClass = isDark ? "text-white" : "text-gray-900";
  const inputClass = isDark ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300";
  const labelClass = isDark ? "text-gray-300" : "text-gray-700";

  useEffect(() => {
    generateCaptcha();
    const saved = window.sessionStorage.getItem('pendingQuery');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((current) => ({ ...current, ...parsed }));
        if (parsed.photo) setPhotoPreview(parsed.photo);
      } catch { window.sessionStorage.removeItem('pendingQuery'); }
    }
  }, []);
  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/me').then((res) => res.json()).then((data) => {
        if (data.user) setFormData((current) => ({ ...current, name: data.user.name || '', email: data.user.email || '', mobile: data.user.phone || '', ward: data.user.ward || current.ward || '' }));
      });
    }
  }, [status, router]);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    setCaptcha({ num1, num2, answer: "" });
    setCaptchaCorrect(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage("Photo size must be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setFormData(prev => ({ ...prev, photo: base64 }));
      setPhotoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCaptchaChange = (value) => {
    setCaptcha({ ...captcha, answer: value });
    setCaptchaCorrect(parseInt(value) === captcha.num1 + captcha.num2);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (status !== 'authenticated') {
      window.sessionStorage.setItem('pendingQuery', JSON.stringify(formData));
      setLoginRequired(true);
      setMessage('Please login first to submit your query. Your filled details have been saved.');
      return;
    }
    setLoading(true);
    if (!formData.ward || !formData.category || !formData.subject || !formData.description) {
      setMessage("Please fill all required fields");
      setLoading(false);
      return;
    }
    if (formData.mobile.length !== 10 || !/^[6-9]/.test(formData.mobile)) {
      setMessage("Please enter a valid 10-digit mobile number");
      setLoading(false);
      return;
    }
    if (!captchaCorrect) {
      setMessage("Please solve the captcha correctly");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, ward: parseInt(formData.ward) })
      });
      const data = await res.json();
      if (res.ok) {
        window.sessionStorage.removeItem('pendingQuery');
        setQueryId(data.queryId);
        setStep("success");
      } else {
        setMessage(data.message || "Failed to submit query");
      }
    } catch (error) {
      console.error("Submit Error:", error);
      setMessage("Error submitting query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "form") {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${textClass} py-12 px-4`}>
        <div className="max-w-2xl mx-auto">
          <div className={`${bgClass} rounded-lg shadow-lg p-8`}>
            <h1 className="text-3xl font-bold mb-2 text-green-700 dark:text-yellow-400">शिकायत दर्ज करें</h1>
            <h2 className="text-3xl font-bold mb-6">Raise Query</h2>
            {message && <div className={`mb-4 p-3 rounded-lg ${message.includes("Error") || message.includes("reached") ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{message}{loginRequired && <button type="button" onClick={() => router.push('/signin?callbackUrl=%2Fgrievance')} className="ml-3 rounded bg-green-700 px-3 py-1 text-sm font-semibold text-white">Login now</button>}</div>}
            {rateLimitInfo && <div className={`mb-4 p-3 rounded-lg ${isDark ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}>{rateLimitInfo.message}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className={`block ${labelClass} mb-2 font-semibold`}>Ward *</label><select name="ward" value={formData.ward} onChange={handleInputChange} required className={`w-full px-4 py-2 border rounded ${inputClass}`}><option value="">Select Ward</option>{[1,2,3,4,5,6,7,8,9,10].map(w => <option key={w} value={w}>Ward {w}</option>)}</select></div>
              <div><label className={`block ${labelClass} mb-2 font-semibold`}>Category *</label><select name="category" value={formData.category} onChange={handleInputChange} required className={`w-full px-4 py-2 border rounded ${inputClass}`}>{QUERY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className={`block ${labelClass} mb-2 font-semibold`}>Subject *</label><input type="text" name="subject" value={formData.subject} onChange={handleInputChange} maxLength="100" required className={`w-full px-4 py-2 border rounded ${inputClass}`} /><p className={`text-xs mt-1 ${labelClass}`}>{formData.subject.length}/100</p></div>
              <div><label className={`block ${labelClass} mb-2 font-semibold`}>Description *</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" required className={`w-full px-4 py-2 border rounded ${inputClass}`} /></div>
              <div><label className={`block ${labelClass} mb-2 font-semibold`}>Address</label><input type="text" name="address" value={formData.address} onChange={handleInputChange} className={`w-full px-4 py-2 border rounded ${inputClass}`} /></div>
              <div><label className={`block ${labelClass} mb-2 font-semibold`}>Photo (Optional)</label><input type="file" accept="image/*,.pdf" onChange={handlePhotoUpload} className={`w-full px-4 py-2 border rounded ${inputClass}`} />{photoPreview && <img src={photoPreview} alt="Preview" className="mt-3 w-32 h-32 object-cover rounded" />}</div>
              <div className={`${isDark ? "bg-gray-700" : "bg-gray-100"} p-4 rounded`}><label className={`block ${labelClass} mb-2 font-semibold`}>Captcha: {captcha.num1} + {captcha.num2} = ?</label><div className="flex gap-2"><input type="number" value={captcha.answer} onChange={(e) => handleCaptchaChange(e.target.value)} className={`flex-1 px-3 py-2 border rounded ${captchaCorrect ? "border-green-500" : "border-red-300"}`} /><button type="button" onClick={generateCaptcha} className="px-3 py-2 bg-gray-500 text-white rounded">🔄</button></div>{captchaCorrect && <p className="text-green-600 text-sm mt-2">✓ Correct</p>}</div>
              <button type="submit" disabled={loading || !captchaCorrect} className="w-full px-4 py-3 bg-green-600 text-white rounded font-semibold disabled:opacity-50">{loading ? "Submitting..." : "Submit"}</button>
            </form>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"} ${textClass} py-12 px-4`}>
      <div className="max-w-md mx-auto">
        <div className={`${bgClass} rounded-lg shadow-lg p-8 text-center fixed inset-0 flex items-center justify-center`}>
          <div className="w-full max-w-md">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-4 text-green-600">Grievance Submitted!</h1>
            <div className={`${isDark ? "bg-gray-700" : "bg-gray-100"} p-6 rounded mb-6`}>
              <p className={`text-sm ${labelClass} mb-2`}>Query ID</p>
              <p className="text-2xl font-bold text-green-600 mb-4">{queryId}</p>
              <p className={`text-sm ${labelClass}`}>SAVE THIS ID</p>
            </div>
            <div className="space-y-3">
              <button onClick={() => router.push(`/track?id=${queryId}`)} className="w-full px-4 py-3 bg-blue-600 text-white rounded font-semibold">📍 Track Query</button>
              <button onClick={() => window.location.href = "/"} className="w-full px-4 py-3 bg-green-600 text-white rounded font-semibold">🏠 Home</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
