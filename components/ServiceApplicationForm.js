"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastContainer } from './Toast';
import LoginRequiredModal from './LoginRequiredModal';
import DocumentChecklist from './DocumentChecklist';
import { useLanguage } from '@/app/language-provider';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function calculateAgeFromDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

export default function ServiceApplicationForm({
  serviceType,
  fields,
  requiredDocuments = [],
  includeContactFields = false,
}) {
  const { status } = useSession();
  const { language } = useLanguage();
  const { toasts, addToast, removeToast } = useToast();
  const [values, setValues] = useState({});
  const [dateErrors, setDateErrors] = useState({});
  const [documents, setDocuments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const todayString = new Date().toISOString().split('T')[0];
  const formText = language === 'hi'
    ? {
      loading: 'आपका आवेदन लोड हो रहा है…',
      applicantDetails: 'आवेदक का विवरण',
      name: 'नाम',
      mobile: 'मोबाइल नंबर',
      emailOptional: 'ईमेल (वैकल्पिक)',
      optional: ' (वैकल्पिक)',
      supportingDocuments: 'सहायक दस्तावेज़ (PDF, JPG, PNG; {requirement})',
      required: 'आवश्यक',
      uploadAtLeastOne: 'कम से कम एक दस्तावेज़ अपलोड करें:',
      documentsReady: 'दस्तावेज़ अपलोड के लिए तैयार हैं।',
      savingDraft: 'ड्राफ्ट सेव हो रहा है…',
      saveDraft: 'ड्राफ्ट सेव करें',
      submitting: 'सबमिट हो रहा है…',
      submitApplication: 'आवेदन सबमिट करें',
      yourUpdates: 'आपके आवेदन की स्थिति',
      adminRemark: 'व्यवस्थापक की टिप्पणी:',
      uploadedDocuments: 'आपके अपलोड किए गए दस्तावेज़',
      panchayatDocuments: 'पंचायत से दस्तावेज़',
      uploadSuccess: 'दस्तावेज़ सफलतापूर्वक अपलोड हुए। अब आप सेवा आवेदन सबमिट कर सकते हैं।',
      uploadRequired: 'कृपया कम से कम एक आवश्यक सहायक दस्तावेज़ अपलोड करें।',
      submitFailed: 'आपका आवेदन सबमिट नहीं हो सका। कृपया पुनः प्रयास करें।',
      draftSaved: 'ड्राफ्ट सफलतापूर्वक सेव हुआ।',
      onlyDocuments: 'केवल PDF, JPG और PNG दस्तावेज़ स्वीकार किए जाते हैं।',
      documentSize: 'हर दस्तावेज़ 5 MB से छोटा होना चाहिए।',
      readDocument: 'दस्तावेज़ पढ़ा नहीं जा सका।',
      chooseFive: '5 MB से कम आकार के अधिकतम पांच PDF, JPG या PNG दस्तावेज़ चुनें।',
      saveDraftFailed: 'ड्राफ्ट सेव नहीं हो सका।',
      uploadFailed: 'अतिरिक्त दस्तावेज़ अपलोड नहीं हो सके।',
      additionalUploaded: 'अतिरिक्त दस्तावेज़ सफलतापूर्वक अपलोड हुए।',
    }
    : {
      loading: 'Loading your application…',
      applicantDetails: 'Applicant details',
      name: 'Name',
      mobile: 'Mobile Number',
      emailOptional: 'Email (Optional)',
      optional: ' (Optional)',
      supportingDocuments: 'Supporting documents (PDF, JPG, PNG; {requirement})',
      required: 'required',
      uploadAtLeastOne: 'Upload at least one:',
      documentsReady: 'document(s) ready to upload.',
      savingDraft: 'Saving draft…',
      saveDraft: 'Save draft',
      submitting: 'Submitting…',
      submitApplication: 'Submit application',
      yourUpdates: 'Your application updates',
      adminRemark: 'Admin remark:',
      uploadedDocuments: 'Your uploaded documents',
      panchayatDocuments: 'Documents from Panchayat',
      uploadSuccess: 'document(s) uploaded successfully. You can submit the service now.',
      uploadRequired: 'Please upload at least one required supporting document.',
      submitFailed: 'Your application could not be submitted. Please try again.',
      draftSaved: 'Draft saved successfully.',
      onlyDocuments: 'Only PDF, JPG, and PNG documents are allowed.',
      documentSize: 'Each document must be smaller than 5 MB.',
      readDocument: 'Unable to read document.',
      chooseFive: 'Choose up to five PDF, JPG, or PNG documents under 5 MB each.',
      saveDraftFailed: 'Unable to save draft.',
      uploadFailed: 'Unable to upload additional documents.',
      additionalUploaded: 'Additional documents uploaded successfully.',
    };

  useEffect(() => {
    if (!includeContactFields || status !== 'authenticated') return;
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.user) return;
        setValues((current) => ({
          ...current,
          applicantName: current.applicantName || data.user.name || '',
          applicantMobile: current.applicantMobile || data.user.phone || '',
          applicantEmail: current.applicantEmail || data.user.email || '',
        }));
      });
  }, [includeContactFields, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/applications')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setApplications(data?.applications || []))
      .catch(() => setApplications([]));
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch(`/api/drafts?serviceType=${encodeURIComponent(serviceType)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((drafts) => {
        const draft = drafts?.[0];
        if (draft) {
          setDraftId(draft._id);
          setValues(draft.data || {});
        }
      })
      .catch(() => {});
  }, [serviceType, status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    const interval = setInterval(() => {
      fetch('/api/applications')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setApplications(data?.applications || []))
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [status]);

  async function onFiles(event) {
    const files = Array.from(event.target.files || []);
    try {
      const parsed = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
                return reject(new Error(formText.onlyDocuments));
              }
              if (file.size > MAX_FILE_SIZE) {
                return reject(new Error(formText.documentSize));
              }
              const reader = new FileReader();
              reader.onload = () =>
                resolve({ fileName: file.name, fileUrl: reader.result, mimeType: file.type });
              reader.onerror = () => reject(new Error(formText.readDocument));
              reader.readAsDataURL(file);
            })
        )
      );

      setDocuments(parsed);
      addToast(`${parsed.length} ${formText.uploadSuccess}`, 'success');
    } catch (error) {
      addToast(error.message, 'error');
    }
  }

  async function submit(event) {
    event.preventDefault();

    if (status === 'unauthenticated') {
      setShowLoginWarning(true);
      return;
    }

    setSubmitting(true);

    if (requiredDocuments.length && !documents.length) {
      setSubmitting(false);
      return addToast(formText.uploadRequired, 'error');
    }

    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceType, formData: values, documents }),
    });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      return addToast(data.message || formText.submitFailed, 'error');
    }

    setValues({});
    setDocuments([]);
    if (draftId) fetch(`/api/drafts?id=${encodeURIComponent(draftId)}`, { method: 'DELETE' }).catch(() => {});

    fetch('/api/applications')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setApplications(payload?.applications || []))
      .catch(() => setApplications([]));

    const delivery = data.emailDelivery;
    const emailStatus = delivery?.status === 'sent'
      ? ' A confirmation email was sent.'
      : delivery?.status === 'skipped'
        ? ` Confirmation email not sent: ${delivery.reason}`
        : delivery?.status === 'failed'
          ? ` Confirmation email failed: ${delivery.error}`
          : '';
    addToast(`Submitted successfully. Your reference number is ${data.applicationNumber}.${emailStatus}`, delivery?.status === 'failed' || delivery?.status === 'skipped' ? 'warning' : 'success', 7000);
  }

  async function saveDraft() {
    if (status !== 'authenticated') {
      setShowLoginWarning(true);
      return;
    }
    setSavingDraft(true);
    const response = await fetch('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceType, title: `${serviceType.replace(/-/g, ' ')} application`, data: values }),
    });
    const data = await response.json();
    setSavingDraft(false);
    if (!response.ok) return addToast(data.error || formText.saveDraftFailed, 'error');
    setDraftId(data._id);
    addToast(formText.draftSaved, 'success');
  }

  async function uploadMoreDocuments(applicationId, files) {
    const selected = Array.from(files || []);
    if (!selected.length) return;

    if (
      selected.length > 5 ||
      selected.some(
        (file) => !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > MAX_FILE_SIZE
      )
    ) {
      return addToast(formText.chooseFive, 'error');
    }

    const docs = await Promise.all(
      selected.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ fileName: file.name, fileUrl: reader.result, mimeType: file.type });
            reader.onerror = () => reject(new Error(formText.readDocument));
            reader.readAsDataURL(file);
          })
      )
    );

    const response = await fetch(`/api/applications/${applicationId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: docs }),
    });
    const data = await response.json();

    if (!response.ok) {
      return addToast(data.message || formText.uploadFailed, 'error');
    }

    fetch('/api/applications')
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => setApplications(payload?.applications || []))
      .catch(() => setApplications([]));

    addToast(data.message || formText.additionalUploaded, 'success');
  }

  if (status === 'loading') {
    return <p className="pt-36 text-center">{formText.loading}</p>;
  }

  const myApplications = applications.filter((application) => application.serviceType === serviceType);
  const applicationStatuses = language === 'hi'
    ? { Submitted: 'जमा किया गया', 'Under Review': 'समीक्षा में', 'Need Documents': 'दस्तावेज़ आवश्यक', Updated: 'अपडेट किया गया', Approved: 'स्वीकृत', Rejected: 'अस्वीकृत', Completed: 'पूर्ण' }
    : {};

  return (
    <>
      <DocumentChecklist documents={requiredDocuments} />

      <form onSubmit={submit} className="space-y-4">
        {includeContactFields && (
          <div className="space-y-4 rounded border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-emerald-950/40">
            <p className="text-sm font-semibold text-green-900 dark:text-emerald-200">{formText.applicantDetails}</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700">{formText.name} *</label>
              <input
                required
                type="text"
                value={values.applicantName || ''}
                onChange={(e) => setValues({ ...values, applicantName: e.target.value })}
                className="mt-1 w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">{formText.mobile} *</label>
              <input
                required
                type="tel"
                inputMode="numeric"
                maxLength="10"
                value={values.applicantMobile || ''}
                onChange={(e) =>
                  setValues({
                    ...values,
                    applicantMobile: e.target.value.replace(/\D/g, '').slice(0, 10),
                  })
                }
                className="mt-1 w-full rounded border p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700">{formText.emailOptional}</label>
              <input
                type="email"
                value={values.applicantEmail || ''}
                onChange={(e) => setValues({ ...values, applicantEmail: e.target.value })}
                className="mt-1 w-full rounded border p-2"
              />
            </div>
          </div>
        )}

        {fields.map((field) => {
          const isBirthDob = field.name === 'dateOfBirth' || field.name === 'dob';
          const isBirthAge = serviceType === 'birth-certificate' && field.name === 'applicantAge';
          const inputMax = isBirthDob ? todayString : field.max;
          const isFutureDateRestricted = field.type === 'date' && Boolean(inputMax);
          const dateError = dateErrors[field.name];

          return (
            <div key={field.name}>
              <label className="block text-sm font-semibold text-gray-700">
                {field.label} {field.required ? '*' : formText.optional}
              </label>
              {field.multiline ? (
                <textarea
                  required={field.required}
                  value={values[field.name] || ''}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  className="mt-1 w-full rounded border p-2"
                  rows="3"
                />
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  value={values[field.name] || ''}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                  className="mt-1 w-full rounded border bg-white p-2"
                >
                  <option value="">{field.placeholder || 'Select'}</option>
                  {(field.options || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  aria-describedby={dateError ? `${field.name}-error` : undefined}
                  type={field.type || 'text'}
                  min={field.min}
                  max={inputMax}
                  required={field.required}
                  readOnly={field.readOnly || isBirthAge}
                  value={values[field.name] || ''}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    if (isFutureDateRestricted && nextValue > inputMax) {
                      setDateErrors((current) => ({
                        ...current,
                        [field.name]: language === 'hi'
                          ? 'भविष्य की तिथि चुनना संभव नहीं है। कृपया आज या उससे पहले की तिथि चुनें।'
                          : 'Future date cannot be selected. Please choose today or an earlier date.',
                      }));
                      return;
                    }

                    setDateErrors((current) => {
                      if (!current[field.name]) return current;
                      const nextErrors = { ...current };
                      delete nextErrors[field.name];
                      return nextErrors;
                    });
                    setValues((current) => {
                      const nextData = { ...current, [field.name]: nextValue };

                      if (isBirthDob) {
                        const computedAge = calculateAgeFromDate(nextValue);
                        if (computedAge !== '') {
                          nextData.applicantAge = computedAge;
                        }
                      }

                      return nextData;
                    });
                  }}
                  className="mt-1 w-full rounded border p-2"
                />
              )}
              {dateError && (
                <p id={`${field.name}-error`} role="alert" className="mt-1 text-sm text-red-600">
                  {dateError}
                </p>
              )}
            </div>
          );
        })}

        <div>
          <label className="block text-sm font-semibold text-gray-700">
            {formText.supportingDocuments.replace('{requirement}', requiredDocuments.length ? formText.required : formText.optional.trim().toLowerCase())}
          </label>
          {requiredDocuments.length > 0 && (
            <p className="mt-1 text-xs text-gray-600">
              {formText.uploadAtLeastOne} {requiredDocuments.join(', ')}.
            </p>
          )}
          <input
            type="file"
            multiple
            accept="application/pdf,image/jpeg,image/png"
            onChange={onFiles}
            className="mt-1 w-full rounded border p-2"
          />
          {documents.length > 0 && (
            <p className="mt-1 text-sm text-gray-600">{documents.length} {formText.documentsReady}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveDraft}
            disabled={savingDraft || submitting}
            className="min-h-12 rounded border border-green-700 px-4 py-2 font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
          >
            {savingDraft ? formText.savingDraft : formText.saveDraft}
          </button>
          <button
            type="submit"
            disabled={submitting || savingDraft}
            className="min-h-12 rounded bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {submitting ? formText.submitting : formText.submitApplication}
          </button>
        </div>
      </form>

      <ToastContainer toasts={toasts} removeToast={removeToast} isDark={false} />

      {showLoginWarning && (
        <LoginRequiredModal
          isOpen={showLoginWarning}
          onClose={() => setShowLoginWarning(false)}
          callbackUrl={typeof window === 'undefined' ? '/' : window.location.pathname}
        />
      )}

      {myApplications.length > 0 && (
        <section className="mt-8 rounded-lg border border-green-200 bg-green-50 p-4 text-gray-800 dark:border-green-900 dark:bg-emerald-950/40 dark:text-slate-100">
          <h2 className="text-lg font-bold text-green-800">{formText.yourUpdates}: {serviceType.replace(/-/g, ' ')}</h2>
          <div className="mt-3 space-y-3">
            {myApplications.map((application) => (
              <article
                key={application.id}
                className="rounded border border-green-100 bg-white p-3 dark:border-green-900 dark:bg-slate-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong>{application.applicationNumber}</strong>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                    {applicationStatuses[application.status] || application.status}
                  </span>
                </div>

                {application.adminRemarks && (
                  <p className="mt-2 text-sm">
                    <strong>{formText.adminRemark}</strong> {application.adminRemarks}
                  </p>
                )}

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {application.documents?.length > 0 && (
                    <div className="rounded border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                        {formText.uploadedDocuments}
                      </p>
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {application.documents.map((document, index) => (
                          <li key={`citizen-${document.fileName || index}`}>
                            <a
                              href={document.fileUrl}
                              download={document.fileName}
                              className="text-emerald-700 underline dark:text-emerald-300"
                            >
                              {document.fileName || `${language === 'hi' ? 'दस्तावेज़' : 'Document'} ${index + 1}`}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {application.adminDocuments?.length > 0 && (
                    <div className="rounded border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        {formText.panchayatDocuments}
                      </p>
                      <ul className="mt-2 list-disc pl-5 text-sm">
                        {application.adminDocuments.map((document, index) => (
                          <li key={`admin-${document.fileName || index}`}>
                            <a
                              href={document.fileUrl}
                              download={document.fileName}
                              className="text-amber-700 underline dark:text-amber-300"
                            >
                              {document.fileName || `${language === 'hi' ? 'दस्तावेज़' : 'Document'} ${index + 1}`}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {(application.status === 'Need Documents' ||
                  application.status === 'Updated' ||
                  application.status === 'Rejected') && (
                  <div className="mt-3 rounded border border-dashed border-orange-300 bg-orange-50 p-3 dark:border-orange-700 dark:bg-orange-950/20">
                    <label className="block text-sm font-semibold text-orange-700 dark:text-orange-200">
                      Upload additional documents
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(event) => uploadMoreDocuments(application.id, event.target.files)}
                      className="mt-2 block w-full rounded border border-orange-200 bg-white p-2 text-xs dark:border-orange-700 dark:bg-slate-800"
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
