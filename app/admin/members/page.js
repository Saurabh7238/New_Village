"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useToast, ToastContainer } from '@/components/Toast';
import {
  MEMBER_DESIGNATIONS,
  MEMBER_STATUSES,
  GENDER_OPTIONS,
  CATEGORY_OPTIONS
} from '@/lib/memberDisplay';

function MemberForm({ member, onSubmit, onCancel, addToast }) {
  const [formData, setFormData] = useState(member || {
    fullName: '',
    designation: 'Ward Member',
    wardNo: '',
    mobileNumber: '',
    aadhaarNumber: '',
    whatsappNumber: '',
    emailId: '',
    tenureStart: '',
    tenureEnd: '',
    status: 'Active',
    fatherHusbandName: '',
    address: '',
    education: '',
    committees: '',
    joiningDate: '',
    gender: '',
    category: '',
    displayOrder: 999,
    photo: ''
  });
  const [photoPreview, setPhotoPreview] = useState(member?.photo || null);

  useEffect(() => {
    if (!member) return;
    setFormData({
      ...member,
      aadhaarNumber: '',
      committees: Array.isArray(member.committees) ? member.committees.join(', ') : member.committees || '',
      tenureStart: member.tenureStart ? String(member.tenureStart).slice(0, 10) : '',
      tenureEnd: member.tenureEnd ? String(member.tenureEnd).slice(0, 10) : '',
      joiningDate: member.joiningDate ? String(member.joiningDate).slice(0, 10) : '',
    });
    setPhotoPreview(member.photo || null);
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Photo size must be less than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo: reader.result }));
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const committees = formData.committees
      ? formData.committees.split(',').map(c => c.trim()).filter(c => c)
      : [];

    onSubmit({
      ...formData,
      committees,
      wardNo: formData.wardNo ? parseInt(formData.wardNo) : null,
      displayOrder: parseInt(formData.displayOrder) || 999
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Designation *</label>
          <select
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          >
            {MEMBER_DESIGNATIONS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
          <input
            type="text"
            name="mobileNumber"
            value={formData.mobileNumber}
            onChange={handleChange}
            required
            placeholder="10-digit number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
          <input
            type="password"
            name="aadhaarNumber"
            value={formData.aadhaarNumber || ''}
            onChange={handleChange}
            inputMode="numeric"
            maxLength="12"
            placeholder="Used only to link the registered user"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ward No.</label>
          <input
            type="number"
            name="wardNo"
            value={formData.wardNo}
            onChange={handleChange}
            placeholder="For ward members"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenure Start *</label>
          <input
            type="date"
            name="tenureStart"
            value={formData.tenureStart}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tenure End *</label>
          <input
            type="date"
            name="tenureEnd"
            value={formData.tenureEnd}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="emailId"
            value={formData.emailId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
          <input
            type="text"
            name="whatsappNumber"
            value={formData.whatsappNumber}
            onChange={handleChange}
            placeholder="10-digit number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        {photoPreview && (
          <div className="col-span-2 flex items-center gap-4">
            <Image src={photoPreview} alt="Preview" width={80} height={80} unoptimized className="h-20 w-20 rounded-full object-cover" />
            <button
              type="button"
              onClick={() => { setFormData(prev => ({ ...prev, photo: '' })); setPhotoPreview(null); }}
              className="text-red-600 text-sm hover:text-red-800"
            >
              Remove Photo
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          >
            {MEMBER_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          >
            <option value="">Select</option>
            {GENDER_OPTIONS.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          >
            <option value="">Select</option>
            {CATEGORY_OPTIONS.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
          <input
            type="number"
            name="displayOrder"
            value={formData.displayOrder}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
          <input
            type="date"
            name="joiningDate"
            value={formData.joiningDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Father/Husband Name</label>
        <input
          type="text"
          name="fatherHusbandName"
          value={formData.fatherHusbandName}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows="2"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
        <input
          type="text"
          name="education"
          value={formData.education}
          onChange={handleChange}
          placeholder="e.g., Graduate, 12th Pass"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Committees</label>
        <input
          type="text"
          name="committees"
          value={formData.committees}
          onChange={handleChange}
          placeholder="Comma-separated list"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium"
        >
            {member?._id || member?.id ? 'Update Member' : 'Add Member'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const response = await fetch('/api/members');
      if (!response.ok) throw new Error('Failed to fetch members');
      const data = await response.json();
      setMembers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData) {
    const isEditing = Boolean(editingMember?._id || editingMember?.id);
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? { ...formData, id: editingMember._id || editingMember.id } : formData)
      });

      if (!response.ok) throw new Error('Failed to save member');

      const savedMember = await response.json();
      setEditingMember(isEditing ? savedMember : null);
      setShowForm(true);
      await fetchMembers();
      addToast(isEditing ? 'Member updated successfully.' : 'Member added successfully.', 'success');
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this member?')) return;

    try {
      const response = await fetch('/api/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) throw new Error('Failed to delete member');

      await fetchMembers();
      addToast('Member deleted successfully.', 'success');
    } catch (err) {
      addToast('Error: ' + err.message, 'error');
    }
  }

  const filteredMembers = members.filter(m =>
    m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="pt-36 text-center">Loading...</div>;

  return (
    <div className="pt-36 max-w-7xl mx-auto px-4 pb-12">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Manage Members</h1>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or designation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500"
        />
        <button
          onClick={() => { setEditingMember(null); setShowForm(!showForm); }}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium"
        >
          {showForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingMember ? 'Edit Member' : 'Add New Member'}
          </h2>
          <MemberForm
            member={editingMember}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setEditingMember(null); }}
            addToast={addToast}
          />
        </div>
      )}

      <div className="hidden md:block overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Designation</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Ward</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Mobile</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Tenure</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No members found' : 'No members added yet'}
                </td>
              </tr>
            ) : (
              filteredMembers.map(member => (
                <tr key={member._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100"><div>{member.fullName}</div><div className="text-xs text-gray-500">{member.uniqueId || 'Not linked'}</div></td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{member.designation}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{member.wardNo || '—'}</td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">{member.mobileNumber}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      member.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      member.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(member.tenureStart).getFullYear()}-{new Date(member.tenureEnd).getFullYear()}
                  </td>
                  <td className="px-6 py-3 text-sm space-x-2">
                    <button
                      onClick={() => { setEditingMember(member); setShowForm(true); }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <ToastContainer toasts={toasts} removeToast={removeToast} isDark={false} />

      <div className="md:hidden space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No members found' : 'No members added yet'}
          </div>
        ) : (
          filteredMembers.map(member => (
            <div key={member._id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-green-700 dark:text-green-400">{member.fullName}</p><p className="text-xs text-gray-500">{member.uniqueId || 'Not linked'}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{member.designation}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                    member.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    member.status === 'Inactive' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {member.status}
                  </span>
                </div>
                <div className="border-t dark:border-gray-700 pt-2 grid grid-cols-2 gap-2 text-xs">
                  <div><strong>Ward:</strong> {member.wardNo || '—'}</div>
                  <div><strong>Mobile:</strong> {member.mobileNumber}</div>
                  <div><strong>Tenure:</strong> {new Date(member.tenureStart).getFullYear()}-{new Date(member.tenureEnd).getFullYear()}</div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => { setEditingMember(member); setShowForm(true); }}
                    className="flex-1 rounded bg-blue-600 dark:bg-blue-700 px-2 py-2 text-xs text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="flex-1 rounded bg-red-600 dark:bg-red-700 px-2 py-2 text-xs text-white hover:bg-red-700 dark:hover:bg-red-600 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredMembers.length > 0 && (
        <p className="mt-4 text-sm text-gray-600">Total members: {filteredMembers.length}</p>
      )}
    </div>
  );
}
