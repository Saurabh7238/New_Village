"use client";

import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { sortMembersByHierarchy, groupWardMembersByWard, formatTenure, getStatusColor, DESIGNATION_HIERARCHY } from '@/lib/memberDisplay';
import Image from 'next/image';

function MemberCard({ member }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = getStatusColor(member.status);
  const statusColors = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <div className="flex gap-4">
        {member.photo ? (
          <div className="flex-shrink-0">
            <Image
              src={member.photo}
              alt={member.fullName}
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-2xl text-gray-600">👤</span>
          </div>
        )}

        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-900">{member.fullName}</h2>
          <p className="text-sm font-semibold text-green-700">
            {member.designation}
            {member.wardNo && ` • Ward ${member.wardNo}`}
          </p>

          <div className="mt-2 flex gap-4 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[statusColor]}`}>
              {member.status}
            </span>
            <span className="text-gray-600">
              {formatTenure(member.tenureStart, member.tenureEnd)}
            </span>
          </div>

          <div className="mt-3 flex gap-3 text-sm">
            {member.mobileNumber && (
              <a
                href={`tel:${member.mobileNumber}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                📞 {member.mobileNumber}
              </a>
            )}
            {member.emailId && (
              <a
                href={`mailto:${member.emailId}`}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
              >
                📧
              </a>
            )}
          </div>

          {(member.address || member.committees?.length > 0 || member.education) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-sm text-green-700 hover:text-green-900 font-medium"
            >
              {expanded ? 'Hide Details' : 'View Details'}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-700">
          {member.fatherHusbandName && (
            <p><span className="font-semibold">Relation:</span> {member.fatherHusbandName}</p>
          )}
          {member.address && (
            <p className="mt-2"><span className="font-semibold">Address:</span> {member.address}</p>
          )}
          {member.education && (
            <p className="mt-2"><span className="font-semibold">Education:</span> {member.education}</p>
          )}
          {member.committees?.length > 0 && (
            <p className="mt-2"><span className="font-semibold">Committees:</span> {member.committees.join(', ')}</p>
          )}
          {member.gender && (
            <p className="mt-2"><span className="font-semibold">Gender:</span> {member.gender}</p>
          )}
          {member.category && (
            <p className="mt-2"><span className="font-semibold">Category:</span> {member.category}</p>
          )}
          {member.whatsappNumber && (
            <p className="mt-2"><span className="font-semibold">WhatsApp:</span> {member.whatsappNumber}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const response = await fetch('/api/members');
        if (!response.ok) throw new Error('Failed to fetch members');
        const data = await response.json();
        setMembers(sortMembersByHierarchy(data));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading Members..." />;
  }

  if (error) {
    return (
      <div className="pt-36 max-w-5xl mx-auto px-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  const leadershipRoles = ['Gram Pradhan', 'Up-Pradhan', 'Panchayat Secretary'];
  const leadership = members.filter(m => leadershipRoles.includes(m.designation));
  const wardMembers = members.filter(m => m.designation === 'Ward Member');
  const staff = members.filter(m => !leadershipRoles.includes(m.designation) && m.designation !== 'Ward Member');

  return (
    <div className="pt-36 max-w-6xl mx-auto px-4 pb-12">
      <h1 className="text-4xl font-bold text-green-700 mb-2">Panchayat Members</h1>
      <p className="text-gray-700 mb-8">
        Meet the elected members and officials of your Gram Panchayat. Below are the representatives serving the community.
      </p>

      {leadership.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-green-700 mb-6">Leadership</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leadership.map(member => (
              <MemberCard key={member._id} member={member} />
            ))}
          </div>
        </section>
      )}

      {wardMembers.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-green-700 mb-6">Ward Members</h2>
          {Object.entries(groupWardMembersByWard(wardMembers))
            .sort((a, b) => {
              const aWard = a[0] === 'Unassigned' ? Infinity : parseInt(a[0]);
              const bWard = b[0] === 'Unassigned' ? Infinity : parseInt(b[0]);
              return aWard - bWard;
            })
            .map(([wardNo, members]) => (
              <div key={wardNo} className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ward {wardNo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map(member => (
                    <MemberCard key={member._id} member={member} />
                  ))}
                </div>
              </div>
            ))}
        </section>
      )}

      {staff.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-green-700 mb-6">Administrative Staff</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(member => (
              <MemberCard key={member._id} member={member} />
            ))}
          </div>
        </section>
      )}

      {members.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No members added yet.</p>
        </div>
      )}
    </div>
  );
}
