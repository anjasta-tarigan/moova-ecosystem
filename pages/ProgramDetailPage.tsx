import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { 
  ArrowLeft, Calendar, Users, Zap, CheckCircle, 
  Clock, Download, Trophy, HelpCircle, ChevronDown, 
  MapPin, Star, Share2, Shield, Target, Award,
  BookOpen, ChevronRight, Play, Check, Rocket
} from 'lucide-react';

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

// --- MOCK DATA STORE ---
const getProgramData = (id: string | undefined) => {
  // In a real app, fetch based on ID. Returning a specific set for demo.
  return {
    id: id || "global-challenges",
    title: "Global Innovation Challenge 2025",
    tagline: "Design the future of climate resilience.",
    type: "Competition",
    status: "Open",
    deadline: "Oct 15, 2024",
    heroImage: "https://picsum.photos/1200/800?random=101",
    videoPreview: "https://picsum.photos/1200/800?random=102", // Placeholder for video thumbnail
    tags: ["Sustainability", "Deep Tech", "Hardware"],
    stats: {
      prizePool: "$50,000",
      teams: "120+",
      countries: "25",
      equity: "0%"
    },
    about: {
      short: "A 6-month global marathon to design, build, and deploy solutions for climate resilience.",
      full: "The Global Innovation Challenge isn't just a hackathon. It's a structured acceleration vehicle designed to take interdisciplinary teams from a 'napkin sketch' to a venture-backable prototype. We focus specifically on hardware-software hybrids that address UN SDG 13 (Climate Action). Teams will have access to our proprietary knowledge graph, mentor network, and simulation tools."
    },
    benefits: [
      { title: "Non-Dilutive Funding", desc: "Top 3 teams receive equity-free grants to build their MVP.", icon: <Zap size={24} /> },
      { title: "Expert Mentorship", desc: "Weekly office hours with engineers from Tesla, Google, and CERN.", icon: <Users size={24} /> },
      { title: "Global Exposure", desc: "Pitch live to a panel of international investors and policymakers.", icon: <Rocket size={24} /> },
      { title: "Cloud Credits", desc: "$10k in AWS/GCP credits for every finalist team.", icon: <BookOpen size={24} /> },
    ],
    timeline: [
      { date: "Aug 01", title: "Applications Open", desc: "Form your team and submit the initial concept note.", status: "completed" },
      { date: "Oct 15", title: "Submission Deadline", desc: "Final date to submit your technical proposal.", status: "active" },
      { date: "Nov 01", title: "Finalist Announcement", desc: "Top 20 teams selected for the acceleration phase.", status: "upcoming" },
      { date: "Dec 10", title: "Demo Day", desc: "Live pitches to the global investment committee.", status: "upcoming" }
    ],
    whatYouGet: [
      "Access to the GIVA proprietary knowledge graph.",
      "3-month license for standard CAD/Simulation software.",
      "Certificate of participation for all team members.",
      "Direct fast-track to Partner Accelerator interviews."
    ],
    eligibility: [
      "Teams of 2-5 members.",
      "At least one member must be currently enrolled in a university.",
      "Solution must address SDG 13 (Climate Action).",
      "Prototype must be technically feasible (TRL 3+)."
    ],
    judging: [
      { criteria: "Technical Feasibility", percent: 40, desc: "Can it actually be built?" },
      { criteria: "Impact Potential", percent: 30, desc: "Scale of the problem addressed." },
      { criteria: "Business Viability", percent: 20, desc: "Path to market and unit economics." },
      { criteria: "Team Capability", percent: 10, desc: "Ability to execute." }
    ],
    awards: [
      { rank: "1st Place", prize: "$25,000 Grant", desc: "+ 6 months Incubation & Media Coverage" },
      { rank: "2nd Place", prize: "$15,000 Grant", desc: "+ Mentorship Package" },
      { rank: "3rd Place", prize: "$10,000 Grant", desc: "+ Partner Perks" }
    ],
    mentors: [
      { name: "Dr. A. Wright", role: "Chief Scientist, BioGen", img: "https://picsum.photos/100/100?random=1" },
      { name: "Sarah Chen", role: "Partner, Future Ventures", img: "https://picsum.photos/100/100?random=2" },
      { name: "Marcus T.", role: "Engineer, SpaceX", img: "https://picsum.photos/100/100?random=3" },
      { name: "Elena R.", role: "Climate Researcher", img: "https://picsum.photos/100/100?random=4" }
    ],
    faqs: [
      { q: "Do I need a fully formed team to apply?", a: "No, you can apply as an individual and we will match you during the team formation phase." },
      { q: "Does GIVA take equity?", a: "No. All grants for this challenge are equity-free. We believe in supporting student innovation without barriers." },
      { q: "Can we submit a project we started previously?", a: "Yes, as long as the majority of the new development happens during the program timeline." }
    ]
  };
};

// --- Components ---

const ProgressBar = ({ percent }: { percent: number }) => (
  <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden">
    <div className="bg-brand-gradient h-2.5 rounded-full" style={{ width: `${percent}%` }}></div>
  </div>
);

const ProgramDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const program = getProgramData(id);
  
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRegister = () => {
    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      navigate('/join');
    }, 800);
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 lg:pb-0 font-sans text-slate-900">
      
      {/* 1. HERO SECTION */}
      <div className="relative h-[85vh] w-full overflow-hidden bg-slate-900">
        <img 
          src={program.heroImage} 
          alt={program.title} 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        
        {/* Navigation Back */}
        <div className="absolute top-6 left-6 z-40">
          <button 
            onClick={() => navigate('/programs')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white hover:text-primary-900 transition-all duration-300 font-medium text-sm"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="absolute inset-0 flex flex-col justify-end pb-12 lg:pb-24 z-30">
          <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl">
            <FadeIn>
              <div className="flex flex-wrap gap-2 mb-6">
                 <span className="px-3 py-1 bg-secondary-500 text-white text-xs font-bold uppercase tracking-widest rounded-full">
                    {program.type}
                 </span>
                 {program.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest rounded-full">
                      {tag}
                    </span>
                 ))}
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight leading-none max-w-5xl">
                {program.title}
              </h1>
              <p className="text-xl md:text-2xl text-slate-200 font-light max-w-2xl mb-10 leading-relaxed">
                {program.tagline}
              </p>

              {/* Hero Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/10 pt-8 max-w-4xl">
                 <div>
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Prize Pool</p>
                   <p className="text-2xl md:text-3xl font-bold text-white">{program.stats.prizePool}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Deadline</p>
                   <p className="text-2xl md:text-3xl font-bold text-white">{program.deadline}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Teams</p>
                   <p className="text-2xl md:text-3xl font-bold text-white">{program.stats.teams}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-1">Equity Taken</p>
                   <p className="text-2xl md:text-3xl font-bold text-emerald-400">{program.stats.equity}</p>
                 </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* 2. STICKY NAV (Desktop) */}
      <div className={`hidden lg:block sticky top-[80px] z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-all duration-300 ${hasScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="container mx-auto px-20 py-3 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 truncate max-w-md">{program.title}</h2>
          <div className="flex gap-6 text-sm font-medium text-slate-600">
            {['Overview', 'Timeline', 'Rules', 'Awards', 'FAQ'].map(item => (
              <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="hover:text-primary-600 transition-colors">
                {item}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={handleRegister}>Register Now</Button>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl -mt-8 relative z-40 pb-20">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT CONTENT COLUMN */}
          <div className="flex-1 space-y-16">
            
            {/* OVERVIEW */}
            <section id="overview" className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
               <h3 className="text-2xl font-bold text-slate-900 mb-4">About the Program</h3>
               <p className="text-lg text-slate-600 leading-relaxed mb-6 font-light">
                 {program.about.short}
               </p>
               <p className="text-slate-600 leading-relaxed mb-8">
                 {program.about.full}
               </p>
               
               <h4 className="font-bold text-slate-900 mb-4">Why You Should Join</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {program.benefits.map((ben, i) => (
                   <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                     <div className="shrink-0 text-primary-600">{ben.icon}</div>
                     <div>
                       <h5 className="font-bold text-slate-900 text-sm">{ben.title}</h5>
                       <p className="text-xs text-slate-500 mt-1">{ben.desc}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </section>

            {/* TIMELINE */}
            <section id="timeline">
              <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                <Clock className="text-primary-600" /> Program Timeline
              </h3>
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-12">
                {program.timeline.map((step, i) => (
                  <FadeIn key={i} delay={i * 100}>
                    <div className="relative pl-8 group">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-slate-50 transition-colors ${
                        step.status === 'completed' ? 'bg-emerald-500' : 
                        step.status === 'active' ? 'bg-primary-500 scale-125' : 'bg-slate-300'
                      }`}></div>
                      <span className={`text-xs font-bold uppercase tracking-widest mb-1 block ${
                        step.status === 'active' ? 'text-primary-600' : 'text-slate-400'
                      }`}>
                        {step.date} {step.status === 'active' && '• Current Phase'}
                      </span>
                      <h4 className={`text-lg font-bold mb-1 ${step.status === 'active' ? 'text-slate-900' : 'text-slate-700'}`}>
                        {step.title}
                      </h4>
                      <p className="text-slate-500 text-sm max-w-md">{step.desc}</p>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </section>

            {/* WHAT YOU GET & ELIGIBILITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <section className="bg-primary-900 text-white p-8 rounded-3xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-500/20 rounded-full blur-3xl"></div>
                 <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                   <Star className="text-yellow-400 fill-yellow-400" /> What You'll Get
                 </h3>
                 <ul className="space-y-4 relative z-10">
                   {program.whatYouGet.map((item, i) => (
                     <li key={i} className="flex items-start gap-3 text-primary-100 text-sm">
                       <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                       <span>{item}</span>
                     </li>
                   ))}
                 </ul>
               </section>

               <section className="bg-white p-8 rounded-3xl border border-slate-200">
                 <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                   <Shield className="text-primary-600" /> Who Can Join
                 </h3>
                 <ul className="space-y-4">
                   {program.eligibility.map((item, i) => (
                     <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                       <span>{item}</span>
                     </li>
                   ))}
                 </ul>
               </section>
            </div>

            {/* RULES & REQUIREMENTS */}
            <section id="rules" className="bg-white rounded-2xl border border-slate-200 p-8">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                 <h3 className="text-2xl font-bold text-slate-900">Rules & Requirements</h3>
                 <Button variant="outline" size="sm" className="gap-2">
                   <Download size={16} /> Download Rulebook
                 </Button>
               </div>
               <p className="text-slate-600 text-sm mb-8 leading-relaxed">
                 All participants must adhere to the official rulebook. Key requirements include original work, team composition limits, and adherence to the GIVA Code of Conduct. Intellectual Property remains 100% with the student teams.
               </p>
               
               <h4 className="font-bold text-slate-900 mb-4">Judging Criteria</h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {program.judging.map((crit, i) => (
                   <div key={i}>
                     <div className="flex justify-between items-center mb-1">
                       <span className="font-bold text-slate-700 text-sm">{crit.criteria}</span>
                       <span className="font-bold text-primary-600 text-sm">{crit.percent}%</span>
                     </div>
                     <ProgressBar percent={crit.percent} />
                     <p className="text-xs text-slate-400 mt-1">{crit.desc}</p>
                   </div>
                 ))}
               </div>
            </section>

            {/* AWARDS */}
            <section id="awards">
               <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
                 <Trophy className="text-amber-500" /> Awards & Recognition
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {program.awards.map((award, i) => (
                   <FadeIn key={i} delay={i * 100}>
                     <div className={`p-6 rounded-2xl border text-center relative overflow-hidden h-full ${
                       i === 0 ? 'bg-gradient-to-b from-amber-50 to-white border-amber-200 shadow-md transform scale-105 z-10' : 'bg-white border-slate-200'
                     }`}>
                       {i === 0 && <div className="absolute top-0 inset-x-0 h-1 bg-amber-400"></div>}
                       <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                         i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
                       }`}>
                         <Award size={24} />
                       </div>
                       <h4 className="font-bold text-slate-900 text-xl">{award.prize}</h4>
                       <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{award.rank}</p>
                       <p className="text-sm text-slate-500 leading-snug">{award.desc}</p>
                     </div>
                   </FadeIn>
                 ))}
               </div>
            </section>

            {/* MENTORS */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Mentors & Judges</h3>
                <button className="text-primary-600 text-sm font-bold hover:underline">View All</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar snap-x">
                {program.mentors.map((mentor, i) => (
                  <div key={i} className="min-w-[180px] snap-center bg-white p-6 rounded-2xl border border-slate-200 text-center hover:border-primary-300 transition-colors">
                    <img src={mentor.img} alt={mentor.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-slate-50" />
                    <h5 className="font-bold text-slate-900">{mentor.name}</h5>
                    <p className="text-xs text-slate-500 mt-1">{mentor.role}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* FAQ */}
            <section id="faq">
               <h3 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h3>
               <div className="space-y-3">
                 {program.faqs.map((faq, idx) => (
                   <div key={idx} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                     <button 
                       onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                       className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                     >
                       {faq.q}
                       <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                     </button>
                     <div className={`transition-all duration-300 overflow-hidden ${activeFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                       <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-3">
                         {faq.a}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </section>

          </div>

          {/* RIGHT SIDEBAR (Desktop Sticky) */}
          <div className="hidden lg:block w-[380px] shrink-0">
             <div className="sticky top-32 space-y-6">
               
               {/* Registration Card */}
               <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase">Registration Status</span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Open
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Ready to innovate?</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Join {program.stats.teams} teams from {program.stats.countries} countries. Deadline is fast approaching.
                  </p>
                  
                  <div className="space-y-3">
                    <Button fullWidth size="lg" onClick={handleRegister}>
                       {isRegistering ? 'Processing...' : 'Register Now'}
                    </Button>
                    <button className="flex items-center justify-center gap-2 w-full py-3 border border-slate-200 rounded-full text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                      <Download size={16} /> Download Syllabus
                    </button>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">Questions? Contact <a href="#" className="text-primary-600 underline">program support</a>.</p>
                  </div>
               </div>

               {/* Share Card */}
               <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h4 className="font-bold text-slate-900 mb-4">Share this Program</h4>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                      <Share2 size={16} /> Copy Link
                    </button>
                    {/* Social Icons Placeholder */}
                    <button className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors">
                      <div className="font-bold">in</div>
                    </button>
                     <button className="w-10 h-10 rounded-lg bg-sky-50 text-sky-500 flex items-center justify-center hover:bg-sky-100 transition-colors">
                      <div className="font-bold">tw</div>
                    </button>
                  </div>
               </div>

             </div>
          </div>

        </div>
      </div>

      {/* MOBILE STICKY CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] flex gap-3 items-center safe-area-bottom">
         <div className="flex-1">
           <p className="text-xs text-slate-400 font-bold uppercase">Deadline: {program.deadline}</p>
           <p className="text-sm font-bold text-slate-900 truncate">{program.title}</p>
         </div>
         <Button onClick={handleRegister}>Register</Button>
      </div>

    </div>
  );
};

export default ProgramDetailPage;