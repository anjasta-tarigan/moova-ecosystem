import React from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import { ArrowRight } from 'lucide-react';

const EcosystemPage: React.FC = () => {
  return (
    <>
      <Section
        id="overview"
        tag="The Ecosystem"
        headline="Connecting the dots of innovation."
        subheadline="GIVA provides a structured environment where every stakeholder in the scientific value chain can thrive."
      >
        <div className="space-y-20 mt-12">
          {/* Startups */}
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="flex-1">
              <span className="text-primary-600 font-bold uppercase tracking-wider text-sm mb-2 block">For Startups</span>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">From Lab to Market</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                We provide early-stage scientific ventures with the mentorship, infrastructure, and pilot opportunities needed to validate technology and secure funding.
              </p>
              <ul className="space-y-3 mb-8 text-slate-700">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full"/> Access to non-dilutive grants</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full"/> Corporate pilot programs</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary-500 rounded-full"/> Technical mentorship</li>
              </ul>
              <Button variant="outline">Apply for Acceleration</Button>
            </div>
            <div className="flex-1 w-full h-64 bg-slate-100 rounded-2xl overflow-hidden">
              <img src="https://picsum.photos/800/600?random=40" alt="Startups" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Investors */}
          <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
             <div className="flex-1">
              <span className="text-secondary-500 font-bold uppercase tracking-wider text-sm mb-2 block">For Investors</span>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">De-risked Deal Flow</h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                Connect with vetted deep tech opportunities. Our rigorous selection process ensures high-quality scientific validity before projects reach your desk.
              </p>
              <Button variant="outline">Request Investor Access</Button>
            </div>
            <div className="flex-1 w-full h-64 bg-slate-100 rounded-2xl overflow-hidden">
               <img src="https://picsum.photos/800/600?random=41" alt="Investors" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
};

export default EcosystemPage;