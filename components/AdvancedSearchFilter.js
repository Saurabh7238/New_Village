'use client';

import { useState } from 'react';
import { Search, ChevronDown, Calendar } from 'lucide-react';

export default function AdvancedSearchFilter({ onSearch, entityType = 'applications' }) {
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
          Advanced Search & Filters
        </div>
        <ChevronDown className={`h-5 w-5 transition ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">
          {/* Search Term */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Search (Name, Email, ID, Title)
            </label>
            <input
              type="text"
              name="searchTerm"
              value={filters.searchTerm}
              onChange={handleChange}
              placeholder="Search..."
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="all">All Statuses</option>
                {(entityType === 'applications' ? applicationStatuses : queryStatuses).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type/Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {entityType === 'applications' ? 'Service Type' : 'Category'}
              </label>
              <select
                name={entityType === 'applications' ? 'type' : 'category'}
                value={entityType === 'applications' ? filters.type : filters.category}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="all">All {entityType === 'applications' ? 'Types' : 'Categories'}</option>
                {(entityType === 'applications' ? applicationTypes : queryCategories).map((item) => (
                  <option key={item.value || item} value={item.value || item}>
                    {item.label || item}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter (Queries only) */}
            {entityType === 'queries' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                <select
                  name="priority"
                  value={filters.priority}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="all">All Priorities</option>
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">From Date</label>
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">To Date</label>
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Sort By</label>
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="createdAt">Date Created (Newest)</option>
                <option value="updatedAt">Date Updated</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSearch}
              className="flex-1 rounded-lg bg-blue-600 py-2 font-bold text-white hover:bg-blue-700"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border border-slate-300 bg-white py-2 font-bold text-slate-900 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
