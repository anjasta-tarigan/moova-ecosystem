import React from 'react';
import { Award, Download, CheckCircle, ExternalLink } from 'lucide-react';
import Button from '../components/Button';

const JudgeCertificates: React.FC = () => {
  // Mock Data
  const certificates = [
    {
      id: "CERT-J-2024-001",
      title: "Lead Judge - Global Science Summit",
      date: "Oct 15, 2024",
      issuer: "GIVA Global",
      status: "Available"
    },
    {
      id: "CERT-J-2024-002",
      title: "Deep Tech Evaluator",
      date: "Nov 10, 2024",
      issuer: "TechGlobal Partners",
      status: "Pending"
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 p-6">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Judge Credentials</h1>
        <p className="text-slate-500 mt-2">Download official certificates verifying your contribution to the ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((cert) => (
          <div key={cert.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary-50 text-primary-600 rounded-xl">
                <Award size={32} />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${cert.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {cert.status}
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-1">{cert.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{cert.issuer} • {cert.date}</p>
            
            <div className="pt-6 border-t border-slate-100 flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                disabled={cert.status !== 'Available'}
                onClick={() => alert("Downloading certificate...")}
              >
                <Download size={16} className="mr-2" /> PDF
              </Button>
              <Button 
                size="sm" 
                className="flex-1"
                disabled={cert.status !== 'Available'}
                onClick={() => window.open(`#/verify/${cert.id}`, '_blank')}
              >
                <ExternalLink size={16} className="mr-2" /> Verify
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {certificates.length === 0 && (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <Award className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-slate-900">No Certificates Yet</h3>
          <p className="text-slate-500">Complete judging assignments to earn credentials.</p>
        </div>
      )}
    </div>
  );
};

export default JudgeCertificates;