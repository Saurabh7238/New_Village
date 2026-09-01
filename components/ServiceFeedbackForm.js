'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';

export default function ServiceFeedbackForm() {
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
    { key: 'speed', label: 'Speed of Service', emoji: '⚡' },
    { key: 'clarity', label: 'Clarity of Information', emoji: '📝' },
    { key: 'helpfulness', label: 'Helpfulness of Staff', emoji: '🤝' },
    { key: 'accuracy', label: 'Accuracy of Service', emoji: '✓' },
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
      <h3 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Service Feedback</h3>

      {submitted && (
        <div className="mb-4 rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-900 dark:text-green-200">
          Thank you for your feedback! We appreciate your input.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Which service did you use?
          </label>
          <select
            value={feedback.serviceType}
            onChange={(e) => setFeedback({ ...feedback, serviceType: e.target.value })}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
          >
            <option value="">Select a service</option>
            <option value="birth-certificate">Birth Certificate</option>
            <option value="death-certificate">Death Certificate</option>
            <option value="aadhaar-request">Aadhaar Request</option>
            <option value="grievance">Grievance / Query</option>
            <option value="appointment">Appointment</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Overall Experience
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
            {feedback.rating}/5 stars
          </p>
        </div>

        {/* Aspect Ratings */}
        <div className="space-y-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-700">
          <p className="font-semibold text-slate-900 dark:text-white">Rate different aspects:</p>
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
            Additional Comments (Optional)
          </label>
          <textarea
            value={feedback.comments}
            onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
            placeholder="Tell us what could be improved..."
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
            You can contact me regarding this feedback
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !feedback.rating || !feedback.serviceType}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
