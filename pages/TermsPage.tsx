import React from 'react';
import Section from '../components/Section';
import { Gavel, Users, Zap, AlertTriangle, Copyright, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span onClick={() => navigate('/')} className="cursor-pointer hover:text-primary-600">Home</span>
            <span>/</span>
            <span className="text-slate-900 font-medium">Terms of Service</span>
          </div>
        </div>
      </div>

      <Section
        id="terms-hero"
        tag="Legal Agreement"
        headline="Rules of Engagement."
        subheadline="By participating in the MOOVA ecosystem, you agree to uphold standards of professional conduct, scientific integrity, and collaboration."
        className="bg-white border-b border-slate-200"
      >
         <div className="mt-8 text-sm text-slate-500">
          Last Updated: October 15, 2024
        </div>
      </Section>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl mt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Content */}
          <div className="flex-1 space-y-12">
            <section>
              <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900 mb-4">
                <Users className="text-primary-600" size={24} /> 1. Ecosystem Participation
              </h3>
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <p className="text-slate-600 leading-relaxed mb-4">
                  MOOVA is a professional network. Users must provide accurate identity and affiliation information. Misrepresentation of academic credentials or institutional status is grounds for immediate account suspension.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  You agree to use the platform solely for lawful purposes related to scientific innovation, research collaboration, and professional networking.
                </p>
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900 mb-4">
                <Copyright className="text-primary-600" size={24} /> 2. Intellectual Property (IP)
              </h3>
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <p className="text-slate-600 leading-relaxed mb-4">
                  <strong>User Content:</strong> You retain full ownership of any research, data, or content you post to MOOVA. By posting, you grant MOOVA a limited license to display this content within the ecosystem context.
                </p>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Platform IP:</strong> The MOOVA interface, matching algorithms, and underlying code are the exclusive property of MOOVA Inc.
                </p>
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900 mb-4">
                <Zap className="text-primary-600" size={24} /> 3. Code of Conduct
              </h3>
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <ul className="space-y-3 text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 shrink-0"></span>
                    No harassment, hate speech, or discrimination based on race, gender, or nationality.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 shrink-0"></span>
                    No sharing of confidential proprietary information without authorization (NDA).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2.5 shrink-0"></span>
                    Maintain scientific rigor; avoid spreading verified misinformation.
                  </li>
                </ul>
              </div>
            </section>

             <section>
              <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900 mb-4">
                <AlertTriangle className="text-primary-600" size={24} /> 4. Liability & Disclaimers
              </h3>
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <p className="text-slate-600 leading-relaxed">
                  The platform is provided "as is". MOOVA facilitates connections but does not guarantee funding outcomes, employment, or the validity of user-generated scientific claims. We are not liable for disputes arising between users regarding IP ownership or partnership agreements.
                </p>
              </div>
            </section>

            <section>
              <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900 mb-4">
                <LogOut className="text-primary-600" size={24} /> 5. Termination
              </h3>
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <p className="text-slate-600 leading-relaxed">
                  We reserve the right to suspend or terminate accounts that violate these Terms or the Community Code of Conduct. Users may terminate their account at any time via the settings menu.
                </p>
              </div>
            </section>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:w-80 shrink-0">
             <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
               <h4 className="font-bold text-slate-900 mb-4">Quick Navigation</h4>
               <ul className="space-y-3 text-sm text-slate-600">
                 <li><a href="#" className="hover:text-primary-600 block">1. Ecosystem Participation</a></li>
                 <li><a href="#" className="hover:text-primary-600 block">2. Intellectual Property</a></li>
                 <li><a href="#" className="hover:text-primary-600 block">3. Code of Conduct</a></li>
                 <li><a href="#" className="hover:text-primary-600 block">4. Liability</a></li>
                 <li><a href="#" className="hover:text-primary-600 block">5. Termination</a></li>
               </ul>
               <div className="mt-8 pt-6 border-t border-slate-100">
                 <h4 className="font-bold text-slate-900 mb-2">Legal Contact</h4>
                 <p className="text-xs text-slate-500 mb-4">For legal notices and subpoenas:</p>
                 <a href="mailto:legal@moova.io" className="text-primary-600 text-sm font-bold hover:underline">legal@moova.io</a>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TermsPage;