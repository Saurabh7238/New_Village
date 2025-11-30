'use client';
import { useState, useEffect } from 'react';

export default function VoterList() {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState('vidhan-sabha');

  // ✅ Fetch from CORRECT API
  useEffect(() => {
    fetchVoters();
  }, [type]);

  const fetchVoters = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/voterdata?type=${type}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setVoters(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Voter fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading voters...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Voter List</h1>
      
      {/* Type Filter */}
      <div className="mb-6 flex gap-4">
        <select 
          value={type} 
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
        >
          <option value="vidhan-sabha">Vidhan Sabha</option>
          <option value="lok-sabha">Lok Sabha</option>
          <option value="gram-panchayat">Gram Panchayat</option>
        </select>
        <button 
          onClick={fetchVoters}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Voters Table */}
      {voters.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No voters found for {type.replace('-', ' ')}
        </div>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-lg">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voter ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {voters.map((voter) => (
                <tr key={voter.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {voter.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {voter.age || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {voter.gender || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {voter.voterId || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => deleteVoter(voter.id, type)}
                      className="text-red-600 hover:text-red-900 mr-3"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  async function deleteVoter(id, type) {
    if (!confirm('Delete this voter?')) return;
    
    try {
      const response = await fetch('/api/voterdata', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type })
      });
      
      if (response.ok) {
        fetchVoters(); // Refresh list
      } else {
        alert('Delete failed');
      }
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  }
}
