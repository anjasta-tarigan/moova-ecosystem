
import React, { useRef, useEffect, useState } from 'react';
import Section from '../components/Section';
import { 
  Globe, Users, Rocket, Heart, CheckCircle, 
  Map, Flag, Layers, Shield, Zap, Sparkles,
  BarChart, TrendingUp, Activity
} from 'lucide-react';
import Button from '../components/Button';
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

const MISSIONS = [
  {
    title: "Access",
    desc: "Innovation shouldn't be gated by geography or funding. We are building pathways for students everywhere to participate.",
    icon: <Globe size={24} />,
    color: "bg-blue-50 text-blue-600"
  },
  {
    title: "Connection",
    desc: "We connect isolated talent. A student in Lagos should be able to co-found a project with a researcher in London.",
    icon: <Users size={24} />,
    color: "bg-purple-50 text-purple-600"
  },
  {
    title: "Execution",
    desc: "Ideas are just the start. We focus on the 'how'—helping teams move from slide decks to functional prototypes.",
    icon: <Rocket size={24} />,
    color: "bg-emerald-50 text-emerald-600"
  },
  {
    title: "Impact",
    desc: "We align curiosity with necessity. Every challenge on MOOVA targets real-world problems (SDGs).",
    icon: <Heart size={24} />,
    color: "bg-pink-50 text-pink-600"
  }
];

const JOURNEY = [
  {
    phase: "Phase 1",
    title: "Foundation",
    status: "Current",
    desc: "Launching the digital platform, hosting pilot competitions, and building the core community of early adopters.",
    icon: <Map size={20} />
  },
  {
    phase: "Phase 2",
    title: "Growth",
    status: "Next",
    desc: "Expanding to university chapters, launching the mentorship matching engine, and partnering with regional hubs.",
    icon: <Layers size={20} />
  },
  {
    phase: "Phase 3",
    title: "Ecosystem",
    status: "Future",
    desc: "A fully integrated engine providing seed grants, incubation support, and direct pathways to global accelerators.",
    icon: <Flag size={20} />
  }
];

const VALUES = [
  { title: "Accessibility", desc: "Open doors, not gatekeeping." },
  { title: "Learning", desc: "Failure is just data gathering." },
  { title: "Collaboration", desc: "We go further together." },
  { title: "Impact", desc: "Innovation with a purpose." }
];

const AboutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white overflow-hidden">
      
      {/* 1. PRODUCT-STYLE HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>
        
        {/* Ambient Backlight */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-l from-primary-200/40 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Text Content */}
            <div className="max-w-xl">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  Our Mission
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                  The Operating System for <span className="text-slate-500">Innovation.</span>
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  We are building the digital infrastructure to bridge the gap between academic theory and real-world impact, democratizing access to the global innovation economy.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => navigate('/join')}>Join the Mission</Button>
                  <Button variant="white" onClick={() => document.getElementById('mission')?.scrollIntoView({ behavior: 'smooth'})}>
                    Read Our Manifesto
                  </Button>
                </div>
              </FadeIn>
            </div>

            {/* Interactive UI Composition */}
            <div className="relative h-[500px] w-full hidden lg:block">
              {/* Main Dashboard Card */}
              <div className="absolute top-10 left-10 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 z-20 animate-float" style={{ animationDuration: '8s' }}>
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Ecosystem Health</h3>
                      <p className="text-xs text-slate-500">Live Metrics</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                    <TrendingUp size={12} /> +12%
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: "Active Projects", val: "1,240" },
                    { label: "Researchers", val: "8,500+" },
                    { label: "Grants Deployed", val: "$2.4M" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-bold mb-1">{stat.label}</p>
                      <p className="text-xl font-bold text-slate-900">{stat.val}</p>
                    </div>
                  ))}
                </div>
                
                <div className="h-32 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden flex items-end px-4 gap-2">
                   {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
                     <div key={i} className="flex-1 bg-slate-200 rounded-t-sm hover:bg-primary-400 transition-colors" style={{ height: `${h}%` }}></div>
                   ))}
                </div>
              </div>

              {/* Floating Profile Card */}
              <div className="absolute -left-4 bottom-20 bg-white rounded-xl shadow-xl border border-slate-200 p-4 w-64 z-30 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-sm">
                    JD
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">Jane Doe</div>
                    <div className="text-xs text-slate-500">Student • MIT</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">BioTech</span>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">Robotics</span>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute top-0 right-10 bg-white rounded-full shadow-lg border border-slate-100 p-2 pr-4 flex items-center gap-3 z-10 animate-float" style={{ animationDelay: '2s' }}>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Impact Certified</div>
                  <div className="text-[10px] text-slate-500">SDG Aligned</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. What is MOOVA? */}
      <Section
        id="what-is-moova"
        tag="The Purpose"
        headline="More than a platform."
        subheadline="We are a community-driven engine for student capability."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mt-12">
          <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
            <p>
              For too long, brilliant students have been stuck in silos. You have the ideas, the energy, and the will to change things, but often lack the structured roadmap, the network, or the resources to start.
            </p>
            <p>
              <strong>MOOVA exists to solve this.</strong>
            </p>
            <p>
              We are building a digital ecosystem where competitions aren't just one-off events, but stepping stones. Where you don't just win a prize, but build a portfolio, find a team, and gain the skills to actually launch your solution.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-3xl opacity-50 blur-xl"></div>
            <div className="relative bg-white border border-slate-100 rounded-2xl p-8 shadow-xl">
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                   <Sparkles size={24} />
                 </div>
                 <h4 className="text-xl font-bold text-slate-900">The MOOVA Standard</h4>
               </div>
               <ul className="space-y-4">
                 {[
                   "Always Student-First",
                   "Focus on Skill-Building",
                   "Transparent Evaluation",
                   "Community Over Competition"
                 ].map((item, i) => (
                   <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                     <CheckCircle size={20} className="text-emerald-500" /> {item}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Vision Statement */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-6 text-center max-w-4xl">
          <FadeIn>
            <span className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-4 block">Our Vision</span>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              "To create a world where every student innovator has the access, network, and resources to turn their curiosity into <span className="text-secondary-600">global solutions</span>."
            </h2>
          </FadeIn>
        </div>
      </section>

      {/* 4. Our Mission */}
      <Section
        id="mission"
        tag="Our Mission"
        headline="Four pillars of action."
        subheadline="How we translate our vision into daily operations."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {MISSIONS.map((m, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all h-full flex flex-col">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${m.color}`}>
                  {m.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{m.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">
                  {m.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* 5. Our Journey (Timeline) */}
      <section className="py-24 bg-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-10 pointer-events-none"></div>
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase rounded-full bg-white/10 text-secondary-400 border border-white/10">
              Roadmap
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-primary-200/70 max-w-2xl mx-auto">
              We are building this ecosystem brick by brick. Here is where we are, and where we are going.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-white/10 -z-10"></div>

            {JOURNEY.map((step, i) => (
              <FadeIn key={i} delay={i * 200}>
                <div className={`relative p-6 rounded-2xl border ${step.status === 'Current' ? 'bg-white/10 border-secondary-500 shadow-[0_0_30px_rgba(219,0,168,0.2)]' : 'bg-white/5 border-white/10'} backdrop-blur-md text-center h-full`}>
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-6 text-lg font-bold border-4 border-primary-900 relative z-10 ${step.status === 'Current' ? 'bg-secondary-500 text-white' : 'bg-white text-primary-900'}`}>
                    {step.icon}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest mb-2 block ${step.status === 'Current' ? 'text-secondary-400' : 'text-primary-300'}`}>
                    {step.phase} • {step.status}
                  </span>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-primary-100/70 text-sm leading-relaxed mb-4">
                    {step.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Our Values */}
      <Section
        id="values"
        tag="Core Values"
        headline="What drives us."
        subheadline="The principles that guide our decisions and community interactions."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {VALUES.map((val, i) => (
            <div key={i} className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all text-center group">
              <div className="mb-4 text-primary-300 group-hover:text-primary-600 transition-colors">
                <Zap size={32} className="mx-auto" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-2">{val.title}</h4>
              <p className="text-slate-500 text-sm">{val.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 7. Trust / CTA */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-4xl">
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-200 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-primary-600">
              <Shield size={32} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Why Trust MOOVA?</h2>
            <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
              <p>
                We know that trust is earned, not claimed. MOOVA is an early-stage platform, but our commitment is long-term.
              </p>
              <p>
                We are built by former student innovators who understand the frustration of broken promises and empty networking events. We are bootstrapping this ecosystem with transparency, integrity, and a relentless focus on <strong>your</strong> success.
              </p>
              <p className="font-bold text-primary-900">
                We invite you to build this with us.
              </p>
            </div>
            <div className="mt-10 flex justify-center gap-4">
              <Button onClick={() => navigate('/join')}>Join the Community</Button>
              <Button variant="outline" onClick={() => navigate('/contact')}>Contact the Team</Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
