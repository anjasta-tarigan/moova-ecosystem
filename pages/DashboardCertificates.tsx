import React, { useState } from 'react';
import { 
  Award, Download, Share2, ExternalLink, QrCode, 
  CheckCircle, Calendar, ShieldCheck, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

// --- MOCK CERTIFICATE DATA ---
const CERTIFICATES = [
  {
    id: "CERT-2024-8821",
    type: "Winner",
    title: "1st Place - Deep Tech Hackathon",
    recipient: "Alex Participant",
    event: "Deep Tech Hackathon: AI for Good",
    date: "Nov 05, 2024",
    issuer: "MOOVA Global",
    description: "Awarded for exceptional innovation in climate resilience technology.",
    status: "Valid",
    signature: "Dr. Alistair Wright",
    theme: "bg-slate-900",
    accent: "text-amber-400"
  },
  {
    id: "CERT-2024-5592",
    type: "Participant",
    title: "Certificate of Participation",
    recipient: "Alex Participant",
    event: "Future Health Innovators Workshop",
    date: "Sep 20, 2024",
    issuer: "BioGen Institute",
    description: "Successfully completed the 3-day intensive workshop on IP strategy.",
    status: "Valid",
    signature: "Sarah Chen",
    theme: "bg-white border-2 border-slate-200",
    accent: "text-primary-600"
  },
  {
    id: "CERT-2023-1102",
    type: "Judge",
    title: "Official Judge",
    recipient: "Alex Participant",
    event: "Regional Science Fair 2023",
    date: "Dec 12, 2023",
    issuer: "Ministry of Education",
    description: "In recognition of voluntary service as a scientific evaluator.",
    status: "Revoked", 
    signature: "System Admin",
    theme: "bg-slate-50",
    accent: "text-slate-600"
  }
];

const DashboardCertificates: React.FC = () => {
  const [selectedCert, setSelectedCert] = useState<typeof CERTIFICATES[0] | null>(null);
  const navigate = useNavigate();

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/#/verify/${id}`;
    navigator.clipboard.writeText(url);
    alert("Verification link copied to clipboard!");
  };

  // --- CERTIFICATE PREVIEW COMPONENT ---
  const CertificatePreview = ({ cert }: { cert: typeof CERTIFICATES[0] }) => {
    const isDark = cert.theme.includes('bg-slate-900');
    
    return (
      <div className={`relative w-full aspect-[1.414/1] p-8 md:p-12 shadow-2xl rounded-sm overflow-hidden flex flex-col justify-between ${cert.theme} ${isDark ? 'text-white' : 'text-slate-900'}`}>
        
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-20 ${isDark ? 'bg-secondary-500' : 'bg-primary-500'}`}></div>

        {/* Header */}
        <div className="relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl ${isDark ? 'bg-white/10 text-white' : 'bg-primary-900 text-white'}`}>
              M
            </div>
            <div>
              <h4 className={`text-sm font-bold uppercase tracking-widest ${isDark ? 'text-white/60' : 'text-slate-500'}`}>MOOVA Ecosystem</h4>
              <p className="text-xs opacity-50">Global Innovation Platform</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xs font-mono opacity-50`}>ID: {cert.id}</p>
            {cert.status === 'Revoked' && <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">REVOKED</span>}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center my-8">
          <h2 className={`text-3xl md:text-5xl font-serif font-bold mb-6 ${cert.accent}`}>{cert.title}</h2>
          <p className="text-sm md:text-base uppercase tracking-widest opacity-60 mb-4">This certifies that</p>
          <h3 className="text-2xl md:text-4xl font-bold mb-6 border-b-2 border-current inline-block pb-2 px-8">{cert.recipient}</h3>
          <p className="text-sm md:text-base opacity-80 max-w-xl mx-auto leading-relaxed">
            Has {cert.type === 'Winner' ? 'won' : 'participated in'} the <strong className={cert.accent}>{cert.event}</strong>. <br/>
            {cert.description}
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex justify-between items-end mt-auto">
          <div>
            <div className="h-px w-40 bg-current opacity-30 mb-2"></div>
            <p className="font-script text-xl">{cert.signature}</p>
            <p className="text-xs uppercase tracking-wider opacity-50">Authorized Signature</p>
          </div>

          <div className="flex flex-col items-center">
             <div className="bg-white p-2 rounded-lg mb-2">
               {/* Simulated QR Code via Lucide Icon for demo */}
               <QrCode size={64} className="text-slate-900" />
             </div>
             <p className="text-[10px] uppercase tracking-widest opacity-50">{cert.date}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Certificates</h1>
          <p className="text-sm text-slate-500 mt-1">Verify, download, and share your achievements.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck size={16} />
          Blockchain Verified
        </div>
      </div>

      {/* Certificate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {CERTIFICATES.map((cert) => (
          <div key={cert.id} className="group bg-white rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col">
            {/* Visual Thumbnail */}
            <div className={`h-48 relative flex items-center justify-center p-6 cursor-pointer ${cert.theme.includes('slate-900') ? 'bg-slate-900' : 'bg-slate-50'}`} onClick={() => setSelectedCert(cert)}>
               <Award size={48} className={`${cert.accent} opacity-80 group-hover:scale-110 transition-transform duration-500`} />
               <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
               {cert.status === 'Revoked' && (
                 <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center backdrop-blur-sm">
                   <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">Revoked</span>
                 </div>
               )}
               <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-md p-2 rounded-full text-white">
                 <ExternalLink size={16} />
               </div>
            </div>

            {/* Info Body */}
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-100 text-slate-600`}>
                  {cert.type}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                  <Calendar size={12} /> {cert.date}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1 leading-snug group-hover:text-primary-600 transition-colors cursor-pointer" onClick={() => setSelectedCert(cert)}>{cert.title}</h3>
              <p className="text-sm text-slate-500 mb-6">{cert.event}</p>
              
              <div className="mt-auto pt-4 border-t border-slate-50 flex gap-3">
                <Button size="sm" variant="outline" className="flex-1 text-xs h-9 font-bold" onClick={() => setSelectedCert(cert)}>
                  View Details
                </Button>
                <button 
                  onClick={() => handleCopyLink(cert.id)}
                  className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-50 hover:border-primary-200 transition-colors"
                  title="Share Verification Link"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white">
              <h3 className="font-bold text-slate-900">Certificate Preview</h3>
              <button onClick={() => setSelectedCert(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 flex items-center justify-center">
               <CertificatePreview cert={selectedCert} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
              <Button variant="outline" onClick={() => window.open(`#/verify/${selectedCert.id}`, '_blank')}>
                <ExternalLink size={16} className="mr-2" /> Verify on Blockchain
              </Button>
              <Button onClick={() => alert('Downloading PDF...')}>
                <Download size={16} className="mr-2" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardCertificates;