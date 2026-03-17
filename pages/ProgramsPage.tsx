
import React, { useRef, useEffect, useState } from 'react';
import Section from '../components/Section';
import { 
  Compass, Beaker, Users, ArrowRight, Lightbulb, 
  Rocket, BookOpen, Layers, CheckCircle, GraduationCap, 
  Briefcase, Building2, Search, Trophy, Map, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

// Helper Icon
const TrendingUpIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);

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
      className={`transition-all duration-700 ease-out transform ${
        onScreen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  );
};

// --- Data ---

const PATHWAY_STEPS = [
  {
    step: "01",
    title: "Explore",
    desc: "Discover problems worth solving. Engage with global challenges and learn from experts.",
    icon: <Search size={24} />
  },
  {
    step: "02",
    title: "Build",
    desc: "Form a team and prototype your solution. Access tools, mentorship, and initial grants.",
    icon: <Layers size={24} />
  },
  {
    step: "03",
    title: "Launch",
    desc: "Validate with real partners. Deploy pilots and present to the global investment network.",
    icon: <Rocket size={24} />
  },
  {
    step: "04",
    title: "Grow",
    desc: "Scale your impact. Join the Fellowship, mentor others, and expand into new markets.",
    icon: <TrendingUpIcon size={24} />
  }
];

const PILLARS = [
  {
    title: "Competitions & Challenges",
    desc: "High-stakes problem solving marathons focused on specific SDGs.",
    icon: <Trophy size={32} />,
    color: "bg-amber-50 text-amber-600"
  },
  {
    title: "Workshops & Learning",
    desc: "Skill-building sessions on IP, fundraising, and deep tech product design.",
    icon: <BookOpen size={32} />,
    color: "bg-blue-50 text-blue-600"
  },
  {
    title: "Incubation & Mentorship",
    desc: "Structured support to turn a prototype into a venture-backable business.",
    icon: <Lightbulb size={32} />,
    color: "bg-purple-50 text-purple-600"
  },
  {
    title: "Showcases & Opportunities",
    desc: "Global stages to present your work to policymakers and investors.",
    icon: <Users size={32} />,
    color: "bg-emerald-50 text-emerald-600"
  }
];

const PERSONAS = [
  {
    title: "Students",
    desc: "Looking to build a portfolio and find a team.",
    icon: <GraduationCap size={24} />
  },
  {
    title: "Researchers",
    desc: "Translating academic discovery into real-world application.",
    icon: <Beaker size={24} />
  },
  {
    title: "Universities",
    desc: "Seeking global partners and student opportunities.",
    icon: <Building2 size={24} />
  },
  {
    title: "Partners",
    desc: "Scouting talent and sponsoring innovation challenges.",
    icon: <Briefcase size={24} />
  }
];

// Reusing existing program data structure for consistency
const PROGRAMS = [
  {
    id: "global-challenges",
    title: "Global Challenges",
    subtitle: "The Spark",
    description: "Open innovation competitions designed to identify outlier talent and solve specific SDGs.",
    icon: <Compass size={32} />,
    color: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    status: "Open for Applications"
  },
  {
    id: "innovation-labs",
    title: "Innovation Labs",
    subtitle: "The Forge",
    description: "A structured incubator environment to turn theoretical concepts into functional prototypes.",
    icon: <Beaker size={32} />,
    color: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-50",
    status: "Waitlist Only"
  },
  {
    id: "academy",
    title: "MOOVA Academy",
    subtitle: "The Foundation",
    description: "Curriculum-based learning modules focusing on deep tech commercialization and IP strategy.",
    icon: <BookOpen size={32} />,
    color: "from-purple-500 to-pink-600",
    bg: "bg-purple-50",
    status: "Always Open"
  },
  {
    id: "fellowship",
    title: "Fellowship Network",
    subtitle: "The Connection",
    description: "A prestigious community of practice for scientific leaders to exchange knowledge and resources.",
    icon: <Users size={32} />,
    color: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    status: "Invite Only"
  }
];

const ProgramsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>
        {/* Soft emerald backdrop */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-tr from-emerald-200/20 via-primary-200/20 to-transparent rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            <div className="max-w-xl">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm">
                  <Layers size={14} className="text-emerald-500" />
                  Ecosystem Tracks
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                  Structured Pathways for <span className="text-slate-500">Deep Tech.</span>
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  A continuous lifecycle of support designed to take you from a curious student to a venture-backed founder.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => document.getElementById('programs-list')?.scrollIntoView({ behavior: 'smooth' })}>
                    Browse Programs
                  </Button>
                  <Button variant="white" onClick={() => navigate('/join')}>Apply for Access</Button>
                </div>
              </FadeIn>
            </div>

            {/* Interactive Program Stack UI */}
            <div className="relative h-[600px] w-full hidden lg:flex flex-col justify-center items-center">
              
              {/* Card 1 (Back) */}
              <div className="absolute top-12 scale-90 opacity-40 w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-200 shadow-lg blur-[1px]">
                <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
                <div className="h-2 w-full bg-slate-100 rounded mb-2"></div>
                <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
              </div>

              {/* Card 2 (Middle) */}
              <div className="absolute top-24 scale-95 opacity-70 w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-200 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                    <BookOpen size={20} />
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded">MOOVA Academy</span>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">IP Strategy Course</h4>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4 overflow-hidden">
                  <div className="w-3/4 h-full bg-purple-500"></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Module 3/4</span>
                  <span>75%</span>
                </div>
              </div>

              {/* Card 3 (Front - Hero) */}
              <div className="absolute top-40 w-full max-w-sm bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl animate-float" style={{ animationDuration: '6s' }}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                    <Rocket size={24} />
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full border border-emerald-200">
                    Active Track
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Global Innovation Challenge</h3>
                <p className="text-xs text-slate-500 mb-6">Phase 2: Technical Validation</p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                      <CheckCircle size={14} />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Team Formation</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-primary-200 shadow-sm">
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-primary-500 flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-slate-900 block">Prototype Submission</span>
                      <span className="text-xs text-slate-500">Due in 4 days</span>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-400" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300"></div>
                    <span className="text-sm font-medium text-slate-500">Final Pitch</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. Innovation Pathway */}
      <Section
        id="pathway"
        tag="The Journey"
        headline="The MOOVA Innovation Pathway."
        subheadline="A continuous lifecycle of support for scientific talent."
      >
        <div className="mt-16 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-0 w-full h-0.5 bg-slate-100 z-0"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
            {PATHWAY_STEPS.map((step, i) => (
              <FadeIn key={i} delay={i * 150} className="h-full">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-primary-300 hover:shadow-lg transition-all h-full group">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl font-black text-slate-100 group-hover:text-primary-100 transition-colors">{step.step}</span>
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </Section>

      {/* 3. Program Pillars */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-primary-600 font-bold uppercase tracking-widest text-xs mb-3 block">What We Offer</span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Program Pillars</h2>
            <p className="text-slate-600">The core mechanisms we use to deliver value to our community.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar, i) => (
              <FadeIn key={i} delay={i * 100} className="h-full">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 h-full hover:translate-y-[-4px] transition-transform duration-300">
                  <div className={`w-16 h-16 rounded-2xl ${pillar.color} bg-opacity-20 flex items-center justify-center mb-6`}>
                    {pillar.icon}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-3">{pillar.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{pillar.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Who Is This For (Personas) */}
      <Section
        id="personas"
        tag="Ecosystem Members"
        headline="Who is this for?"
        subheadline="MOOVA is built for the curious, the ambitious, and the committed."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {PERSONAS.map((p, i) => (
            <FadeIn key={i} delay={i * 100}>
              <div className="bg-white border border-slate-200 p-6 rounded-xl hover:border-primary-400 transition-colors cursor-default group text-center">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                  {p.icon}
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{p.title}</h4>
                <p className="text-xs text-slate-500">{p.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* 5. How It Works */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-10 pointer-events-none"></div>
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">How It Works</h2>
              <p className="text-slate-400 leading-relaxed text-lg mb-8">
                Getting started is simple. We've removed the bureaucracy typically associated with scientific grants and programs.
              </p>
              <Button variant="white" onClick={() => navigate('/join')}>Create Account</Button>
            </div>
            <div className="flex-1 space-y-6">
              {[
                { title: "Join the Community", desc: "Create your profile and list your skills." },
                { title: "Find a Team or Challenge", desc: "Browse open opportunities and match with peers." },
                { title: "Enter the Pipeline", desc: "Submit your concept and start the validation process." },
                { title: "Get Mentored", desc: "Unlock access to experts as you progress." }
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold text-sm shrink-0 mt-1 shadow-lg shadow-primary-900/50">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{step.title}</h4>
                    <p className="text-slate-400 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Current Programs */}
      <Section
        id="programs-list"
        tag="Opportunities"
        headline="Current & Upcoming Programs"
        subheadline="Select a program to learn more about eligibility, timelines, and outcomes."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {PROGRAMS.map((program, idx) => (
            <FadeIn key={program.id} delay={idx * 100}>
              <div 
                onClick={() => navigate(`/programs/${program.id}`)}
                className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden h-full flex flex-col"
              >
                {/* Background Gradient Effect */}
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${program.color} opacity-5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-10 transition-opacity`}></div>
                
                <div className="relative z-10 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-xl ${program.bg} flex items-center justify-center text-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                      {program.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-slate-100 px-3 py-1 rounded-full bg-slate-50">
                      {program.status}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-primary-700 transition-colors">
                    {program.title}
                  </h3>
                  
                  <p className="text-slate-600 leading-relaxed mb-6">
                    {program.description}
                  </p>
                </div>

                <div className="relative z-10 pt-6 border-t border-slate-100 flex items-center text-primary-600 font-bold text-sm group-hover:gap-3 gap-2 transition-all uppercase tracking-wide">
                  View Details <ArrowRight size={16} />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* 7. Why Join Early */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-4xl">
          <div className="bg-gradient-to-br from-primary-50 to-white rounded-3xl p-10 md:p-14 border border-primary-100 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-100 rounded-full blur-[80px] opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10">
              <span className="inline-block mb-4 p-3 bg-white rounded-full shadow-sm text-primary-600">
                <Rocket size={24} />
              </span>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">Why Join Early?</h2>
              <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                MOOVA is currently in its early community phase. By joining now, you become a <strong>Foundational Member</strong>.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 text-left">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-1">Priority Access</h4>
                  <p className="text-xs text-slate-500">First look at new grants and pilot programs.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-1">Direct Feedback</h4>
                  <p className="text-xs text-slate-500">Shape the platform roadmap with the core team.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-900 mb-1">Founding Badge</h4>
                  <p className="text-xs text-slate-500">Permanent recognition on your profile.</p>
                </div>
              </div>

              <Button size="lg" onClick={() => navigate('/join')}>
                Become a Foundational Member
              </Button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default ProgramsPage;
