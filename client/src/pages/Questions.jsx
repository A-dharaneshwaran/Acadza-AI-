import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter } from 'lucide-react';
import { apiRequest } from '../services/api';
import QuestionRenderer from '../components/QuestionRenderer';

export default function Questions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedQ, setSelectedQ] = useState(null);

  useEffect(() => {
    // Ingested questions list from /api/cases
    apiRequest('/cases').then(res => {
      if (res.success && res.cases) {
        setQuestions(res.cases);
        if (res.cases.length > 0) setSelectedQ(res.cases[0]);
      }
    }).finally(() => setLoading(false));
  }, []);

  const filtered = questions.filter(q => 
    q.questionId.toLowerCase().includes(search.toLowerCase()) ||
    (q.questionSnapshot?.chapter || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-[#2b312e] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-[#f4f3ee]">Authoritative Question Bank</h1>
          <p className="text-xs text-[#969e99] mt-1">43 Authoritative JEE/NEET questions stored in MongoDB with native MathML and option sets.</p>
        </div>
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-[#626965] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter questions..."
            className="w-full bg-[#161a18] border border-[#2b312e] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#f4f3ee] placeholder-[#626965] focus:outline-none focus:border-[#4d7c5f]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto">
          {filtered.map(q => (
            <div
              key={q.questionId}
              onClick={() => setSelectedQ(q)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors text-xs ${
                selectedQ?.questionId === q.questionId
                  ? 'bg-[#1b221e] border-[#3e5647]'
                  : 'bg-[#161a18] border-[#2b312e] hover:border-[#38413c]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#f4f3ee]">{q.questionId.slice(0, 16)}...</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1e2421] text-[#8ba895]">{q.questionSnapshot?.questionType}</span>
              </div>
              <div className="text-[11px] text-[#78827c] mt-1 truncate">
                {q.questionSnapshot?.chapter || q.questionSnapshot?.subject || 'JEE Physics / Chem / Math'}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-8 bg-[#161a18] border border-[#2b312e] rounded-lg p-5">
          {selectedQ ? (
            <div className="space-y-4">
              <div className="border-b border-[#242b27] pb-3">
                <div className="text-xs font-mono text-[#8ba895]">Question Record: {selectedQ.questionId}</div>
                <div className="text-sm font-medium text-[#f4f3ee] mt-1">{selectedQ.questionSnapshot?.chapter || 'General Topic'}</div>
              </div>
              <div className="text-xs text-[#969e99]">
                View complete rendered question stem, options, and solution in the <strong className="text-[#8fd1a8]">Investigation Queue</strong>.
              </div>
            </div>
          ) : (
            <div className="text-xs text-[#626965]">Select a question from the list.</div>
          )}
        </div>
      </div>
    </div>
  );
}

