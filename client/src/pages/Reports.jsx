import React, { useState, useEffect } from 'react';
import { FileText, Search, ShieldAlert } from 'lucide-react';
import { apiRequest } from '../services/api';

export default function Reports() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiRequest('/cases').then(res => {
      if (res.success && res.cases) {
        setCases(res.cases);
      }
    }).finally(() => setLoading(false));
  }, []);

  // Flatten all reports from cases
  const allReports = cases.flatMap(c => 
    c.reports.map(r => ({ ...r, questionId: c.questionId, caseId: c.caseId }))
  );

  const filtered = allReports.filter(r => 
    r.reportId.toLowerCase().includes(search.toLowerCase()) ||
    (r.comment || '').toLowerCase().includes(search.toLowerCase()) ||
    r.questionId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-[#2b312e] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[#f4f3ee]">Student Reports Log</h1>
          <p className="text-xs text-[#969e99] mt-1">44 Informal student feedback reports ingested and cross-referenced with questions.</p>
        </div>
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-[#626965] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comment or report ID..."
            className="w-full bg-[#161a18] border border-[#2b312e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#f4f3ee] placeholder-[#626965] focus:outline-none focus:border-[#4d7c5f]"
          />
        </div>
      </div>

      <div className="bg-[#161a18] border border-[#2b312e] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#969e99]">
            <thead className="bg-[#131615] text-[#78827c] text-[10px] uppercase font-semibold border-b border-[#2b312e]">
              <tr>
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Question ID</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Comment</th>
                <th className="py-3 px-4">Reported Date</th>
                <th className="py-3 px-4">Risk Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212623]">
              {filtered.map(r => (
                <tr key={r.reportId} className="hover:bg-[#1a1f1c] transition-colors">
                  <td className="py-3 px-4 font-mono text-[#8fd1a8] font-medium">{r.reportId}</td>
                  <td className="py-3 px-4 font-mono text-[#b3beba] text-[11px]">{r.questionId.slice(0, 12)}...</td>
                  <td className="py-3 px-4 font-mono text-[#78827c]">{r.studentId}</td>
                  <td className="py-3 px-4 text-[#f4f3ee] max-w-xs truncate italic">"{r.comment}"</td>
                  <td className="py-3 px-4 text-[#626965]">{new Date(r.reportedAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    {r.injectionRisk?.injectionDetected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#3b1f1c] text-[#f2b8b3] border border-[#5c2b26]">
                        <ShieldAlert className="w-3 h-3 text-[#e07167]" />
                        <span>Adversarial</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#626965]">Standard</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

