import React from 'react';
import Section from '../components/Section';
import { Shield, Lock, Eye, FileText, Server, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      icon: <FileText size={24} />,
      title: "1. Data Collection Protocols",
      content: "We collect information necessary to facilitate scientific collaboration and ecosystem participation. This includes identity data (name, affiliation), professional data (ORCID iD, publication history), and usage data generated during ecosystem interactions. We do not purchase external marketing lists."
    },
    {
      icon: <Server size={24} />,
      title: "2. Data Usage & Processing",
      content: "Your data is processed to: (a) match you with relevant grants and mentors, (b) validate credentials for community access, and (c) improve our AI matching algorithms. We process this data under the legal basis of legitimate interest and contractual necessity."
    },
    {
      icon: <Globe size={24} />,
      title: "3. International Transfers",
      content: "As a global ecosystem, MOOVA operates across multiple jurisdictions. Data may be transferred to secure servers in the EU, US, and Singapore. All transfers are protected by Standard Contractual Clauses (SCCs) to ensure GDPR compliance."
    },
    {
      icon: <Eye size={24} />,
      title: "4. Visibility & Sharing",
      content: "By default, your professional profile is visible to other verified members to facilitate collaboration. Sensitive contact details are never shared without explicit consent. We do not sell data to third-party advertisers."
    },
    {
      icon: <Lock size={24} />,
      title: "5. Security Measures",
      content: "We employ enterprise-grade encryption (AES-256) for data at rest and in transit. Access controls are strictly enforced based on the principle of least privilege. Regular security audits are conducted by independent third parties."
    },
    {
      icon: <Shield size={24} />,
      title: "6. Your Rights",
      content: "Under GDPR and CCPA, you retain the right to access, rectify, port, or erase your data. You may export your research portfolio at any time via the User Dashboard settings."
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span onClick={() => navigate('/')} className="cursor-pointer hover:text-primary-600">Home</span>
            <span>/</span>
            <span className="text-slate-900 font-medium">Privacy Policy</span>
          </div>
        </div>
      </div>

      <Section
        id="privacy-hero"
        tag="Data Governance"
        headline="Transparency in every interaction."
        subheadline="We view data privacy not just as a compliance requirement, but as a fundamental component of scientific integrity and trust."
        className="bg-white border-b border-slate-200"
      >
        <div className="mt-8 text-sm text-slate-500">
          Last Updated: October 15, 2024 • Effective Date: November 01, 2024
        </div>
      </Section>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl -mt-10 relative z-10">
        <div className="grid grid-cols-1 gap-6">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-900 flex items-center justify-center shrink-0">
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{section.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-base">
                    {section.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-slate-100 rounded-2xl p-8 text-center border border-slate-200">
          <h4 className="font-bold text-slate-900 mb-2">Have specific privacy concerns?</h4>
          <p className="text-slate-600 mb-4">Our Data Protection Officer (DPO) is available to address your inquiries.</p>
          <a href="mailto:privacy@moova.io" className="text-primary-600 font-bold hover:underline">Contact Privacy Team &rarr;</a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;