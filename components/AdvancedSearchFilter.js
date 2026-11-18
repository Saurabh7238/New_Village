'use client';

import { useState } from 'react';
import { Search, ChevronDown, Calendar } from 'lucide-react';
import { useLanguage } from '@/app/language-provider';

export default function AdvancedSearchFilter({ onSearch, entityType = 'applications' }) {
  const { language } = useLanguage();
  const isHindi = language === 'hi';
  const labels = isHindi
    ? {
      title: 'उन्नत खोज और फ़िल्टर',
      search: 'खोजें (नाम, ईमेल, आईडी, शीर्षक)',
      searchPlaceholder: 'खोजें...',
      status: 'स्थिति',
      allStatuses: 'सभी स्थितियां',
      serviceType: 'सेवा का प्रकार',
      category: 'श्रेणी',
      allTypes: 'सभी प्रकार',
      allCategories: 'सभी श्रेणियां',
      priority: 'प्राथमिकता',
      allPriorities: 'सभी प्राथमिकताएं',
      fromDate: 'इस तारीख से',
      toDate: 'इस तारीख तक',
      sortBy: 'क्रमबद्ध करें',
      dateCreated: 'बनाने की तारीख (नवीनतम)',
      dateUpdated: 'अपडेट की तारीख',
      searchButton: 'खोजें',
      reset: 'रीसेट करें',
      statuses: { Submitted: 'जमा किया गया', 'Under Review': 'समीक्षा में', 'Need Documents': 'दस्तावेज़ आवश्यक', Updated: 'अपडेट किया गया', Approved: 'स्वीकृत', Rejected: 'अस्वीकृत', Completed: 'पूर्ण', Open: 'खुला', 'In Progress': 'प्रगति में', Resolved: 'हल किया गया' },
      types: { 'Aadhaar Request': 'आधार अनुरोध', 'Birth Certificate': 'जन्म प्रमाणपत्र', 'Death Certificate': 'मृत्यु प्रमाणपत्र', 'Voter List': 'मतदाता सूची' },
      categories: { Water: 'पानी', Road: 'सड़क', Electricity: 'बिजली', Health: 'स्वास्थ्य', Education: 'शिक्षा', Sanitation: 'स्वच्छता', Agriculture: 'कृषि', 'Public Safety': 'जन सुरक्षा', Other: 'अन्य' },
      priorities: { Low: 'कम', Medium: 'मध्यम', High: 'उच्च', Urgent: 'अत्यावश्यक' },
    }
    : {
      title: 'Advanced Search & Filters',
      search: 'Search (Name, Email, ID, Title)',
      searchPlaceholder: 'Search...',
      status: 'Status',
      allStatuses: 'All Statuses',
      serviceType: 'Service Type',
      category: 'Category',
      allTypes: 'All Types',
      allCategories: 'All Categories',
      priority: 'Priority',
      allPriorities: 'All Priorities',
      fromDate: 'From Date',
      toDate: 'To Date',
      sortBy: 'Sort By',
      dateCreated: 'Date Created (Newest)',
      dateUpdated: 'Date Updated',
      searchButton: 'Search',
      reset: 'Reset',
      statuses: {},
      types: {},
      categories: {},
      priorities: {},
    };
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    category: 'all',
    priority: 'all',
    searchTerm: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: -1,
  });
  const [expanded, setExpanded] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      status: 'all',
      type: 'all',
      category: 'all',
      priority: 'all',
      searchTerm: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: -1,
    });
    onSearch({
      status: 'all',
      type: 'all',
      category: 'all',
      priority: 'all',
      searchTerm: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: -1,
    });
  };

  const applicationTypes = [
    { value: 'aadhaar-request', label: 'Aadhaar Request' },
    { value: 'birth-certificate', label: 'Birth Certificate' },
    { value: 'death-certificate', label: 'Death Certificate' },
    { value: 'voter-list', label: 'Voter List' },
  ];

  const applicationStatuses = [
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Need Documents', label: 'Need Documents' },
    { value: 'Updated', label: 'Updated' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'Completed', label: 'Completed' },
  ];

  const queryCategories = [
    'Water',
    'Road',
    'Electricity',
    'Health',
    'Education',
    'Sanitation',
    'Agriculture',
    'Public Safety',
    'Other',
  ];

  const queryStatuses = [
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Resolved', label: 'Resolved' },
  ];

  const priorities = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Urgent', label: 'Urgent' },
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between font-bold text-slate-900 dark:text-white"
      >
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          {labels.title}
        </div>
        <ChevronDown className={`h-5 w-5 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          {/* Search Term */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {labels.search}
            </label>
            <input
              type="text"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleChange}
              placeholder={labels.searchPlaceholder}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{labels.status}</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="all">{labels.allStatuses}</option>
                {(entityType === 'applications' ? applicationStatuses : queryStatuses).map((s) => (
                  <option key={s.value} value={s.value}>
                    {labels.statuses[s.label] || s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type/Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {entityType === 'applications' ? labels.serviceType : labels.category}
              </label>
              <select
                name={entityType === 'applications' ? 'type' : 'category'}
                value={entityType === 'applications' ? filters.type : filters.category}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="all">{entityType === 'applications' ? labels.allTypes : labels.allCategories}</option>
                {(entityType === 'applications' ? applicationTypes : queryCategories).map((item) => (
                  <option key={item.value || item} value={item.value || item}>
                    {labels.types[item.label] || labels.categories[item.label] || item.label || item}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter (Queries only) */}
            {entityType === 'queries' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{labels.priority}</label>
                <select
                  name="priority"
                  value={filters.priority}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="all">{labels.allPriorities}</option>
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {labels.priorities[p.label] || p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{labels.fromDate}</label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{labels.toDate}</label>
              <div className="relative mt-1">
                <Calendar className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{labels.sortBy}</label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="createdAt">{labels.dateCreated}</option>
                <option value="updatedAt">{labels.dateUpdated}</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSearch}
              className="flex-1 rounded-lg bg-blue-600 py-2 font-bold text-white hover:bg-blue-700"
            >
              {labels.searchButton}
            </button>
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border border-slate-300 bg-white py-2 font-bold text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              {labels.reset}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
