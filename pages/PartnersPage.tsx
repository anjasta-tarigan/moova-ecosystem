
import React, { useRef, useEffect, useState } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import { 
  Users, Briefcase, GraduationCap, Target, Globe, 
  Lightbulb, TrendingUp, Handshake, LayoutList, 
  ChevronRight, ArrowRight, Share2, Building2,
  PieChart, MessageSquare, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Animation Helper ---
const useOnScreen = (ref: React.RefObject<Element>, rootMargin = '0px') => {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return isIntersecting;
};

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref, '-50px');
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        onScreen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// --- Data ---
const PARTNER_MODELS = [
  {
    title: "Academic Partner",
    description: "Universities and schools collaborating on talent development, research-based programs, student pathways, and joint initiatives.",
    icon: <GraduationCap size={28} />,
    color: "bg-blue-50 text-blue-600 border-blue-100"
  },
  {
    title: "Industry Partner",
    description: "Companies providing real-world problem statements, mentorship, pilot projects, or innovation challenges.",
    icon: <Briefcase size={28} />,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100"
  },
  {
    title: "Ecosystem Partner",
    description: "NGOs, foundations, accelerators, and international organizations supporting social impact, sustainability, and innovation ecosystems.",
    icon: <Globe size={28} />,
    color: "bg-purple-50 text-purple-600 border-purple-100"
  },
  {
    title: "Strategic Partner",
    description: "Long-term partners co-shaping MOOVA programs, reports, and regional initiatives.",
    icon: <Target size={28} />,
    color: "bg-amber-50 text-amber-600 border-amber-100"
  },
  {
    title: "Affiliation & Community",
    description: "Student organizations, youth communities, and networks supporting outreach, engagement, and grassroots innovation.",
    icon: <Users size={28} />,
    color: "bg-pink-50 text-pink-600 border-pink-100"
  }
];

const FLOW_STEPS = [
  { num: "01", title: "Identify Goals", desc: "Align on shared objectives." },
  { num: "02", title: "Define Scope", desc: "Determine resource & roles." },
  { num: "03", title: "Design", desc: "Co-create the initiative." },
  { num: "04", title: "Execute", desc: "Launch via MOOVA ecosystem." },
  { num: "05", title: "Impact", desc: "Measure outcomes." }
];

const PartnersPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      
      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>
        {/* Soft Purple Glow */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-l from-purple-200/30 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Text Content */}
            <div className="max-w-xl">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm">
                  <Handshake size={14} className="text-purple-500" />
                  Collaboration
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                  Connect with the <span className="text-slate-500">Next Wave.</span>
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Partner with MOOVA to access high-potential talent, de-risked deep tech deal flow, and measurable impact opportunities.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => document.getElementById('models')?.scrollIntoView({ behavior: 'smooth'})}>
                    View Partnership Models
                  </Button>
                  <Button variant="white">Contact Sales</Button>
                </div>
              </FadeIn>
            </div>

            {/* Interactive Partner Dashboard UI */}
            <div className="relative h-[550px] w-full hidden lg:flex items-center justify-center">
              
              {/* Main Dashboard Panel */}
              <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-float" style={{ animationDuration: '9s' }}>
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Partner Portal</div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">Talent Pipeline</h3>
                      <p className="text-xs text-slate-500">Q3 2024 Report</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-8 text-xs">Download CSV</Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="text-2xl font-bold text-purple-700">142</div>
                      <div className="text-xs font-medium text-purple-600 uppercase">Applications</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="text-2xl font-bold text-blue-700">18</div>
                      <div className="text-xs font-medium text-blue-600 uppercase">Qualified Leads</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Matches</div>
                    {[
                      { name: "Project Alpha", type: "Deep Tech", status: "Reviewing" },
                      { name: "CarbonFix", type: "Clean Energy", status: "Interview" },
                      { name: "MediAI", type: "Health", status: "Connected" }
                    ].map((match, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{match.name}</div>
                            <div className="text-[10px] text-slate-500">{match.type}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">
                          {match.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Success Card */}
              <div className="absolute -right-6 top-20 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-48 z-20 animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <Check size={16} />
                  </div>
                  <div className="text-xs font-bold text-emerald-700">Pilot Launched</div>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  Your challenge "Urban Mobility 2030" has launched successfully.
                </p>
              </div>

              {/* Floating Chart Card */}
              <div className="absolute -left-8 bottom-32 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-48 z-20 animate-float" style={{ animationDelay: '1.5s' }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-600">Engagement</span>
                  <PieChart size={14} className="text-slate-400" />
                </div>
                <div className="h-16 flex items-end justify-between gap-1">
                  {[30, 50, 45, 70, 60, 85].map((h, i) => (
                    <div key={i} className="w-full bg-purple-500 rounded-t-sm" style={{ height: `${h}%`, opacity: 0.5 + (i * 0.1) }}></div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. Why Partner */}
      <Section
        id="why-partner"
        tag="Why MOOVA"
        headline="More Than Collaboration — An Ecosystem."
        subheadline="We don’t just run programs. We build long-term innovation pathways connecting talent, problems, and impact."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {[
            { icon: <Users size={24} />, title: "Emerging Talent", desc: "Access future innovators early in their journey." },
            { icon: <Lightbulb size={24} />, title: "Co-Creation", desc: "Develop science-based solutions for real needs." },
            { icon: <TrendingUp size={24} />, title: "Measurable Impact", desc: "Track outcomes aligned with SDGs." },
            { icon: <Globe size={24} />, title: "Global Exposure", desc: "Connect with a borderless network." }
          ].map((card, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="h-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 mb-4">
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* 3. Partnership Models */}
      <Section
        id="models"
        tag="Partnership Models"
        headline="Flexible Collaboration, Shared Impact."
        subheadline="MOOVA offers multiple partnership models tailored to different institutions, goals, and levels of involvement."
        className="bg-slate-50"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {PARTNER_MODELS.map((model, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 hover:shadow-xl transition-all duration-300 h-full group">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 border ${model.color} bg-opacity-50`}>
                  {model.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary-700 transition-colors">
                  {model.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {model.description}
                </p>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400 group-hover:text-primary-600 transition-colors">
                  Learn More <ChevronRight size={14} />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* 4. Collaboration Flow */}
      <Section
        id="process"
        tag="Collaboration Flow"
        headline="Simple, Transparent, Purpose-Driven."
        subheadline="Every partnership follows a clear process to ensure alignment, execution, and measurable outcomes."
      >
        <div className="relative mt-12">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-slate-100 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
            {FLOW_STEPS.map((step, i) => (
              <FadeIn key={i} delay={i * 150}>
                <div className="flex flex-col items-center text-center md:items-start md:text-left group">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-100 text-slate-300 font-bold text-xl flex items-center justify-center mb-6 shadow-sm group-hover:border-primary-500 group-hover:text-primary-600 transition-colors relative z-10">
                    {step.num}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h4>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      {/* 5. Impact & Outcomes */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-10 pointer-events-none" />
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase rounded-full bg-white/10 text-emerald-400 border border-white/5">
                Shared Impact
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed for Real Results.</h2>
              <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Partnerships with MOOVA aim to create tangible outcomes — for people, organizations, and society. We measure success beyond participation.
              </p>
            </div>
            
            <div className="flex-1 w-full grid grid-cols-2 gap-4">
              {[
                { label: "Network Status", val: "Building", icon: <Users size={20}/> },
                { label: "Planned Pilots", val: "3", icon: <LayoutList size={20}/> },
                { label: "Collab Model", val: "Co-Design", icon: <Lightbulb size={20}/> },
                { label: "SDGs Aligned", val: "17", icon: <Globe size={20}/> },
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors">
                  <div className="mb-3 text-emerald-400 opacity-80">{stat.icon}</div>
                  <span className="text-4xl font-bold mb-1">{stat.val}</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Trusted By (Placeholder) */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl text-center">
           <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 block">Founding Partners & Early Supporters</span>
           <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 w-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                  Partner {i}
                </div>
              ))}
              <div className="h-12 w-40 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 uppercase hover:text-primary-600 hover:border-primary-300 transition-colors cursor-pointer">
                Your Logo Here
              </div>
           </div>
        </div>
      </section>

      {/* 7. CTA */}
      <section className="py-32 bg-slate-50 relative">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl text-center relative z-10">
          <FadeIn className="max-w-3xl mx-auto">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-10 text-primary-600 shadow-xl shadow-primary-900/5 rotate-3 hover:rotate-6 transition-transform duration-500 border border-slate-100">
               <Handshake size={40} />
             </div>
             <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Become a MOOVA Partner.</h2>
             <p className="text-xl text-slate-500 mb-10 leading-relaxed">
               Whether you represent a university, company, organization, or institution — let’s explore how we can build impact together.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Button size="lg" className="h-14 px-10 text-lg">
                 Partner with MOOVA
               </Button>
               <Button variant="white" size="lg" className="h-14 px-10 text-lg border border-slate-200 text-slate-600 hover:text-primary-700">
                 Request Collaboration Deck
               </Button>
             </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
};

export default PartnersPage;
