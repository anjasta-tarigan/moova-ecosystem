import React, { useState } from 'react';
import Section from '../components/Section';
import { Cookie, Settings, BarChart, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

const CookiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    functional: false,
    marketing: false
  });

  const togglePreference = (key: keyof typeof preferences) => {
    if (key === 'essential') return; // Cannot toggle essential
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    // Simulate save logic
    alert("Preferences saved successfully.");
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl py-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span onClick={() => navigate('/')} className="cursor-pointer hover:text-primary-600">Home</span>
            <span>/</span>
            <span className="text-slate-900 font-medium">Cookie Settings</span>
          </div>
        </div>
      </div>

      <Section
        id="cookies-hero"
        tag="Tracking Preferences"
        headline="Control your digital footprint."
        subheadline="We use cookies to improve ecosystem performance, analyze scientific trends, and personalize your experience. Transparency is our default."
        className="bg-white border-b border-slate-200"
      >
      </Section>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl mt-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Manage Consent Preferences</h3>
            <p className="text-slate-600 max-w-3xl">
              You can choose which categories of cookies you wish to enable. "Essential" cookies are necessary for the platform to function and cannot be switched off.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Essential */}
            <div className="p-8 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Settings size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Strictly Essential</h4>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2 py-1 rounded">Required</span>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  These cookies are necessary for the website to function (e.g., logging in, security tokens, load balancing). They do not store any personally identifiable information.
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-400 opacity-75 cursor-not-allowed">
                  <div className="w-10 h-5 bg-primary-900 rounded-full relative">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <span>Always Active</span>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="p-8 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BarChart size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Analytics & Performance</h4>
                  <div 
                    onClick={() => togglePreference('analytics')}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${preferences.analytics ? 'bg-primary-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.analytics ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Allow us to count visits and traffic sources so we can measure and improve the performance of our site. All information these cookies collect is aggregated and anonymous.
                </p>
              </div>
            </div>

            {/* Functional */}
            <div className="p-8 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Zap size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Functional</h4>
                  <div 
                    onClick={() => togglePreference('functional')}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${preferences.functional ? 'bg-primary-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.functional ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  These enable the website to provide enhanced functionality and personalization, such as remembering your region or language preferences.
                </p>
              </div>
            </div>

             {/* Marketing */}
             <div className="p-8 flex flex-col md:flex-row gap-6 items-start">
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Cookie size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-bold text-slate-900">Marketing & Targeting</h4>
                  <div 
                    onClick={() => togglePreference('marketing')}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${preferences.marketing ? 'bg-primary-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.marketing ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant content on other sites.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-4">
             <Button variant="outline" onClick={() => setPreferences({ essential: true, analytics: false, functional: false, marketing: false })}>
               Reject All
             </Button>
             <Button onClick={handleSave}>
               Save Preferences
             </Button>
          </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>For more detailed information, please refer to our <a href="#/privacy" className="underline hover:text-slate-600">Privacy Policy</a>.</p>
        </div>
      </div>
    </div>
  );
};

export default CookiesPage;