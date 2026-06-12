'use client';
import React, { useState, useEffect } from 'react';
import { User, FileText, Calendar, CreditCard } from 'lucide-react';

export default function GramPanchayatDashboard() {
  const [citizenId, setCitizenId] = useState('NOT_LOGGED_IN');
  const [citizenName, setCitizenName] = useState('Citizen');

  useEffect(() => {
    const storedId = localStorage.getItem('citizenId');
    const storedName = localStorage.getItem('citizenName');
    if (storedId) setCitizenId(storedId);
    if (storedName) setCitizenName(storedName);
  }, []);

  const services = [
    { name: 'Aadhaar Services', icon: <CreditCard />, desc: 'Update or Create Aadhaar' },
    { name: 'Birth Certificate', icon: <FileText />, desc: 'Request new certificate' },
    { name: 'Death Certificate', icon: <FileText />, desc: 'Submit request for certificate' },
    { name: 'Book Appointment', icon: <Calendar />, desc: 'Meet with Panchayat Officials' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Gram Panchayat Portal</h1>
          <p className="text-gray-600">Welcome back, {citizenName}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
          <span className="text-sm font-medium text-blue-800">Your Unique ID: </span>
          <span className="font-mono font-bold">{citizenId}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-blue-600 mb-4 bg-blue-50 w-12 h-12 flex items-center justify-center rounded-full">{service.icon}</div>
            <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
            <p className="text-sm text-gray-500 mt-2">{service.desc}</p>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Apply Now</button>
          </div>
        ))}
      </div>
      <footer className="mt-12 text-center text-gray-400 text-sm">&copy; 2026 Digital Gram Panchayat Initiative</footer>
    </div>
  );
}