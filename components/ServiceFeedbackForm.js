'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { useLanguage } from '@/app/language-provider';

export default function ServiceFeedbackForm() {
  const { language } = useLanguage();
  const text = language === 'hi'
    ? {
      title: 'सेवा प्रतिक्रिया',
      thankYou: 'आपकी प्रतिक्रिया के लिए धन्यवाद! हम आपके सुझाव की सराहना करते हैं।',
      serviceQuestion: 'आपने कौन-सी सेवा का उपयोग किया?',
      selectService: 'सेवा चुनें',
      birth: 'जन्म प्रमाणपत्र',
      death: 'मृत्यु प्रमाणपत्र',
      aadhaar: 'आधार अनुरोध',
      grievance: 'शिकायत / प्रश्न',
      appointment: 'अपॉइंटमेंट',
      other: 'अन्य',
      experience: 'समग्र अनुभव',
      stars: 'सितारे',
      rateAspects: 'विभिन्न पहलुओं को रेट करें:',
      speed: 'सेवा की गति',
      clarity: 'जानकारी की स्पष्टता',
      helpfulness: 'कर्मचारियों की सहायता',
      accuracy: 'सेवा की सटीकता',
      comments: 'अतिरिक्त टिप्पणी (वैकल्पिक)',
      commentPlaceholder: 'बताएं कि क्या बेहतर किया जा सकता है...',
      contact: 'इस प्रतिक्रिया के संबंध में मुझसे संपर्क किया जा सकता है',
      submitting: 'सबमिट हो रहा है...',
      submit: 'प्रतिक्रिया सबमिट करें',
    }
    : {
      title: 'Service Feedback',
      thankYou: 'Thank you for your feedback! We appreciate your input.',
      serviceQuestion: 'Which service did you use?',
      selectService: 'Select a service',
      birth: 'Birth Certificate',
      death: 'Death Certificate',
      aadhaar: 'Aadhaar Request',
      grievance: 'Grievance / Query',
      appointment: 'Appointment',
      other: 'Other',
      experience: 'Overall Experience',
      stars: 'stars',
      rateAspects: 'Rate different aspects:',
      speed: 'Speed of Service',
      clarity: 'Clarity of Information',
      helpfulness: 'Helpfulness of Staff',
      accuracy: 'Accuracy of Service',
      comments: 'Additional Comments (Optional)',
      commentPlaceholder: 'Tell us what could be improved...',
      contact: 'You can contact me regarding this feedback',
      submitting: 'Submitting...',
      submit: 'Submit Feedback',
    };
  const [feedback, setFeedback] = useState({
    rating: 0,
    hoverRating: 0,
    serviceType: '',
    aspects: {
      speed: 0,
      clarity: 0,
      helpfulness: 0,
      accuracy: 0,
    },
    comments: '',
    contactAllowed: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const aspects = [
    { key: 'speed', label: text.speed, emoji: '⚡' },
    { key: 'clarity', label: text.clarity, emoji: '📝' },
    { key: 'helpfulness', label: text.helpfulness, emoji: '🤝' },
    { key: 'accuracy', label: text.accuracy, emoji: '✓' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      });

      if (res.ok) {
        setSubmitted(true);
        setFeedback({
          rating: 0,
          hoverRating: 0,
          serviceType: '',
          aspects: { speed: 0, clarity: 0, helpfulness: 0, accuracy: 0 },
          comments: '',
          contactAllowed: false,
        });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Feedback error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 dark:bg-slate-800">
      <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">{text.title}</h3>

      {submitted && (
        <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-900 dark:text-green-200">
          {text.thankYou}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {text.serviceQuestion}
          </label>
          <select
            value={feedback.serviceType}
            onChange={(e) => setFeedback({ ...feedback, serviceType: e.target.value })}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
          >
            <option value="">{text.selectService}</option>
            <option value="birth-certificate">{text.birth}</option>
            <option value="death-certificate">{text.death}</option>
            <option value="aadhaar-request">{text.aadhaar}</option>
            <option value="grievance">{text.grievance}</option>
            <option value="appointment">{text.appointment}</option>
            <option value="other">{text.other}</option>
          </select>
        </div>

        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {text.experience}
          </label>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFeedback({ ...feedback, rating: star })}
                onMouseEnter={() => setFeedback({ ...feedback, hoverRating: star })}
                onMouseLeave={() => setFeedback({ ...feedback, hoverRating: 0 })}
                className="transition hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (feedback.hoverRating || feedback.rating)
                      ? 'fill-amber-500 text-amber-500'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {feedback.rating}/5 {text.stars}
          </p>
        </div>

        {/* Aspect Ratings */}
        <div className="space-y-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
          <p className="font-semibold text-slate-900 dark:text-white">{text.rateAspects}</p>
          {aspects.map((aspect) => (
            <div key={aspect.key}>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>{aspect.emoji}</span> {aspect.label}
              </label>
              <div className="mt-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() =>
                      setFeedback({
                        ...feedback,
                        aspects: { ...feedback.aspects, [aspect.key]: rating },
                      })
                    }
                    className={`h-8 w-8 rounded text-xs font-bold transition ${
                      rating <= feedback.aspects[aspect.key]
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {text.comments}
          </label>
          <textarea
            value={feedback.comments}
            onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
            placeholder={text.commentPlaceholder}
            rows={4}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
          />
        </div>

        {/* Contact Permission */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={feedback.contactAllowed}
            onChange={(e) => setFeedback({ ...feedback, contactAllowed: e.target.checked })}
            className="h-4 w-4"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {text.contact}
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !feedback.rating || !feedback.serviceType}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {loading ? text.submitting : text.submit}
        </button>
      </form>
    </div>
  );
}
