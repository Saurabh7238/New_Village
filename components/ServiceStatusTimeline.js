'use client';

import { CheckCircle, Clock, AlertCircle, XCircle, FileText } from 'lucide-react';
import { useLanguage } from '@/app/language-provider';

export default function ServiceStatusTimeline({ application }) {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const statusSteps = [
    { status: 'Submitted', label: isHindi ? 'जमा किया गया' : 'Submitted', icon: FileText, color: 'blue', desc: isHindi ? 'आवेदन जमा किया गया' : 'Application submitted' },
    { status: 'Under Review', label: isHindi ? 'समीक्षा में' : 'Under Review', icon: Clock, color: 'amber', desc: isHindi ? 'समीक्षा की जा रही है' : 'Being reviewed' },
    { status: 'Need Documents', label: isHindi ? 'दस्तावेज़ आवश्यक' : 'Need Documents', icon: AlertCircle, color: 'purple', desc: isHindi ? 'अतिरिक्त दस्तावेज़ आवश्यक हैं' : 'Additional documents needed' },
    { status: 'Updated', label: isHindi ? 'अपडेट किया गया' : 'Updated', icon: FileText, color: 'cyan', desc: isHindi ? 'दस्तावेज़ अपडेट किए गए' : 'Documents updated' },
    { status: 'Approved', label: isHindi ? 'स्वीकृत' : 'Approved', icon: CheckCircle, color: 'green', desc: isHindi ? 'स्वीकृत' : 'Approved' },
    { status: 'Rejected', label: isHindi ? 'अस्वीकृत' : 'Rejected', icon: XCircle, color: 'red', desc: isHindi ? 'अस्वीकृत' : 'Rejected' },
    { status: 'Completed', label: isHindi ? 'पूर्ण' : 'Completed', icon: CheckCircle, color: 'green', desc: isHindi ? 'पूर्ण' : 'Completed' },
  ];

  const currentStatusIndex = statusSteps.findIndex((s) => s.status === application?.status);

  const getColorClasses = (color, completed) => {
    const colors = {
      blue: completed ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-900',
      amber: completed ? 'bg-amber-500' : 'bg-amber-200 dark:bg-amber-900',
      green: completed ? 'bg-green-500' : 'bg-green-200 dark:bg-green-900',
      red: completed ? 'bg-red-500' : 'bg-red-200 dark:bg-red-900',
      cyan: completed ? 'bg-cyan-500' : 'bg-cyan-200 dark:bg-cyan-900',
      purple: completed ? 'bg-purple-500' : 'bg-purple-200 dark:bg-purple-900',
    };
    return colors[color];
  };

  const getTextColorClasses = (color, completed) => {
    const colors = {
      blue: completed ? 'text-white' : 'text-blue-800 dark:text-blue-200',
      amber: completed ? 'text-white' : 'text-amber-800 dark:text-amber-200',
      green: completed ? 'text-white' : 'text-green-800 dark:text-green-200',
      red: completed ? 'text-white' : 'text-red-800 dark:text-red-200',
      cyan: completed ? 'text-white' : 'text-cyan-800 dark:text-cyan-200',
      purple: completed ? 'text-white' : 'text-purple-800 dark:text-purple-200',
    };
    return colors[color];
  };

  return (
    <div className="rounded-lg bg-white p-6 dark:bg-slate-800">
      <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">{isHindi ? 'आवेदन स्थिति की समयरेखा' : 'Application Status Timeline'}</h3>
      
      <div className="space-y-4">
        {statusSteps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = idx <= currentStatusIndex && application?.status !== 'Rejected';
          const isRejected = application?.status === 'Rejected' && idx === currentStatusIndex;
          const isCurrent = idx === currentStatusIndex;

          return (
            <div key={step.status} className="flex items-start gap-4">
              {/* Timeline Node */}
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full p-2 ${getColorClasses(
                    step.color,
                    isCompleted || isRejected
                  )}`}
                >
                  <Icon className={`h-5 w-5 ${getTextColorClasses(step.color, isCompleted || isRejected)}`} />
                </div>
                {idx < statusSteps.length - 1 && (
                  <div
                    className={`my-1 h-8 w-1 ${
                      isCompleted && !isRejected
                        ? 'bg-green-500'
                        : isRejected
                        ? 'bg-red-500'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <p className={`font-bold ${isCurrent ? 'text-lg' : ''} ${
                  isCompleted || isRejected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {step.label}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{step.desc}</p>
                
                {isCurrent && (
                  <div className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {isHindi ? 'वर्तमान स्थिति' : 'Current Status'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Key Info */}
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-700 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400">{isHindi ? 'जमा किया गया' : 'Submitted'}</p>
          <p className="font-bold text-slate-900 dark:text-white">
            {new Date(application?.createdAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN')}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400">{isHindi ? 'अंतिम अपडेट' : 'Last Updated'}</p>
          <p className="font-bold text-slate-900 dark:text-white">
            {new Date(application?.updatedAt).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN')}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-600 dark:text-slate-400">{isHindi ? 'लंबित दिन' : 'Days Pending'}</p>
          <p className="font-bold text-slate-900 dark:text-white">
            {Math.floor((new Date() - new Date(application?.createdAt)) / (1000 * 60 * 60 * 24))}
          </p>
        </div>
      </div>

      {/* Admin Remarks */}
      {application?.adminRemarks && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700">
          <p className="font-bold text-slate-900 dark:text-white">{isHindi ? 'व्यवस्थापक की टिप्पणी' : 'Admin Remarks'}</p>
          <p className="mt-2 text-slate-700 dark:text-slate-300">{application.adminRemarks}</p>
        </div>
      )}
    </div>
  );
}
