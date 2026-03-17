
import React, { useState, useRef, useEffect } from 'react';
import Section from '../components/Section';
import Button from '../components/Button';
import { 
  MessageSquare, Users, BookOpen, Award, ThumbsUp, MessageCircle, 
  Share2, ArrowRight, Search, Plus, UserPlus, CheckCircle, Shield, 
  Filter, Lock, MoreHorizontal, User as UserIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- Animation Helper (Inlined) ---
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

// --- Mock Data ---

const DISCUSSIONS = [
  {
    id: 1,
    author: "Dr. Elena Rostova",
    role: "Researcher",
    avatar: "ER",
    color: "bg-blue-100 text-blue-700",
    time: "2 hours ago",
    title: "Optimizing Carbon Capture efficiency using reinforcement learning models",
    preview: "We have been testing a new RL agent on simulated porous materials and are seeing a 15% increase in adsorption rates. Is anyone else working with the OpenCatalyst dataset?",
    tags: ["Artificial Intelligence", "Climate Tech", "Data Science"],
    upvotes: 24,
    replies: 8,
    isFollowing: false
  },
  {
    id: 2,
    author: "James Chen",
    role: "Founder",
    avatar: "JC",
    color: "bg-emerald-100 text-emerald-700",
    time: "5 hours ago",
    title: "Looking for a co-founder: Sustainable Packaging Venture",
    preview: "I have secured seed funding and IP for a mycelium-based packaging solution. Looking for a technical co-founder with a background in Material Science.",
    tags: ["Co-founder Match", "Material Science", "Startups"],
    upvotes: 56,
    replies: 12,
    isFollowing: true
  },
  {
    id: 3,
    author: "Prof. Sarah Miller",
    role: "Mentor",
    avatar: "SM",
    color: "bg-purple-100 text-purple-700",
    time: "1 day ago",
    title: "Grant Application Tips for Horizon Europe 2025",
    preview: "Having reviewed over 50 applications last cycle, I noticed three common mistakes deep tech founders make when addressing the 'Impact' section...",
    tags: ["Grants", "Funding", "Mentorship"],
    upvotes: 112,
    replies: 45,
    isFollowing: false
  }
];

const MENTORS = [
  {
    name: "Dr. Alistair Wright",
    title: "Chief Scientist, BioGen",
    specialty: "Biotech & IP Strategy",
    image: "https://picsum.photos/200/200?random=1"
  },
  {
    name: "Yuki Tanaka",
    title: "Partner, Future Ventures",
    specialty: "Deep Tech Investing",
    image: "https://picsum.photos/200/200?random=2"
  },
  {
    name: "Marcus Thorne",
    title: "Lead Engineer, SpaceX",
    specialty: "Aerospace & Robotics",
    image: "https://picsum.photos/200/200?random=3"
  },
  {
    name: "Dr. Emily Zhang",
    title: "Policy Advisor, UN",
    specialty: "AI Ethics & Governance",
    image: "https://picsum.photos/200/200?random=4"
  }
];

const CommunityPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Auth Simulation
  const [discussions, setDiscussions] = useState(DISCUSSIONS);

  const handleUpvote = (id: number) => {
    if (!isLoggedIn) return; // Prevent action if not logged in
    setDiscussions(prev => prev.map(d => 
      d.id === id ? { ...d, upvotes: d.upvotes + 1 } : d
    ));
  };

  const handleFollow = (id: number) => {
    if (!isLoggedIn) return;
    setDiscussions(prev => prev.map(d => 
      d.id === id ? { ...d, isFollowing: !d.isFollowing } : d
    ));
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>
        {/* Soft Blue Glow */}
        <div className="absolute left-0 bottom-0 w-[800px] h-[800px] bg-gradient-to-t from-blue-200/30 to-transparent rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Text Content */}
            <div className="max-w-xl">
              <FadeIn>
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-bold tracking-widest uppercase rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm">
                  <Users size={14} className="text-blue-500" />
                  The Network
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-[1.1]">
                  Collaboration at <span className="text-slate-500">Scale.</span>
                </h1>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  Join a curated ecosystem of early adopters, scientists, and founders working together to solve complex global challenges.
                </p>
                <div className="flex flex-wrap gap-4">
                  {!isLoggedIn && (
                    <>
                      <Button onClick={() => navigate('/join')}>Join the Community</Button>
                      <Button variant="white" onClick={() => navigate('/login')}>Member Login</Button>
                    </>
                  )}
                  {isLoggedIn && (
                    <Button onClick={() => document.getElementById('community-search')?.scrollIntoView({ behavior: 'smooth'})}>
                      Go to Feed
                    </Button>
                  )}
                </div>
              </FadeIn>
            </div>

            {/* Interactive Community UI */}
            <div className="relative h-[500px] w-full hidden lg:flex items-center justify-center">
              
              {/* Profile Card (Back) */}
              <div className="absolute top-10 right-20 bg-white p-4 rounded-xl shadow-lg border border-slate-200 opacity-60 scale-90 w-56 transform -rotate-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-1">
                    <div className="h-2 w-20 bg-slate-200 rounded"></div>
                    <div className="h-2 w-12 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="h-16 bg-slate-50 rounded mb-2"></div>
              </div>

              {/* Feed Card (Front Hero) */}
              <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-float" style={{ animationDuration: '8s' }}>
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500">Discussion Feed</div>
                  <MoreHorizontal size={16} className="text-slate-400" />
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">ER</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900">Elena Rostova <span className="text-slate-400 font-normal">• 2h</span></div>
                      <div className="text-sm font-bold text-slate-800 mb-1">Looking for datasets on carbon capture</div>
                      <p className="text-xs text-slate-500 line-clamp-2">Does anyone have access to the latest porous material benchmarks?</p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-slate-100 w-full"></div>

                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold shrink-0">JC</div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-slate-900">James Chen <span className="text-slate-400 font-normal">• 5h</span></div>
                      <div className="text-sm font-bold text-slate-800 mb-1">Co-Founder Search: AgriTech</div>
                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-600">Hardware</span>
                        <span className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-medium text-slate-600">Robotics</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                  <div className="flex-1 h-6 bg-white border border-slate-200 rounded-full"></div>
                </div>
              </div>

              {/* Match Card */}
              <div className="absolute bottom-20 -left-4 bg-white p-4 rounded-xl shadow-xl border border-slate-200 w-64 z-20 animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">New Match</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white"></div>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-900">Sarah</span> wants to connect.
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="w-full text-xs h-7 py-0">Accept</Button>
                  <button className="w-full text-xs font-bold text-slate-500 hover:bg-slate-50 rounded">Ignore</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Dev Tool: Auth Toggle */}
      <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white px-4 py-2 rounded-full text-xs shadow-lg opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setIsLoggedIn(!isLoggedIn)}>
        Current View: {isLoggedIn ? 'Member (Logged In)' : 'Guest (Logged Out)'}
      </div>

      {/* 1. Community Overview (Hero Sub-section) */}
      <Section
        id="community-search"
        tag="Explore"
        headline="Find your space."
        subheadline="Navigate specialized zones designed for different modes of collaboration."
        className="bg-white border-b border-slate-200"
      >
        {/* Search Bar */}
        <div className="mt-8 bg-slate-50 border border-slate-200 p-2 rounded-xl flex items-center shadow-sm max-w-2xl">
          <Search className="text-slate-400 ml-3" size={20} />
          <input 
            type="text" 
            placeholder="Search discussions, people, or resources..." 
            className="bg-transparent border-none focus:ring-0 flex-1 px-4 text-slate-700 placeholder:text-slate-400 outline-none"
          />
          <button className="bg-primary-900 text-white px-6 py-2 rounded-lg font-medium text-sm hover:bg-primary-800 transition-colors">
            Search
          </button>
        </div>
      </Section>

      {/* 2. Community Spaces */}
      <Section
        id="spaces"
        tag="Ecosystem Hubs"
        headline="Connect & Collaborate"
        subheadline="Access curated environments tailored to your needs."
        className="pb-0"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <MessageSquare size={24} />, title: "Forums", desc: "Technical discussions & Q&A." },
            { icon: <Users size={24} />, title: "Teams", desc: "Find co-founders & talent." },
            { icon: <Award size={24} />, title: "Mentorship", desc: "Connect with industry veterans." },
            { icon: <BookOpen size={24} />, title: "Library", desc: "Open-source tools & papers." },
          ].map((space, idx) => (
            <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-primary-900 mb-4 group-hover:bg-primary-50 transition-colors">
                {space.icon}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{space.title}</h3>
              <p className="text-slate-500 text-sm">{space.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Active Discussions (Feed) */}
      <Section
        id="discussions"
        tag="Trending Conversations"
        headline="See what the community is discussing."
        subheadline="Real-time knowledge exchange on the frontiers of science."
      >
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main Feed */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700">Latest Threads</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors"><Filter size={18} /></button>
                {isLoggedIn && (
                  <Button size="sm" className="gap-2"><Plus size={16} /> New Post</Button>
                )}
              </div>
            </div>

            {discussions.map((post) => (
              <div key={post.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${post.color} flex items-center justify-center font-bold text-sm`}>
                      {post.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{post.author}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] uppercase font-bold rounded-full">{post.role}</span>
                      </div>
                      <span className="text-xs text-slate-400">{post.time}</span>
                    </div>
                  </div>
                  <button className="text-slate-300 hover:text-slate-600">
                    <MoreHorizontal size={20} />
                  </button>
                </div>

                <h4 className="text-xl font-bold text-slate-900 mb-2 leading-tight hover:text-primary-700 cursor-pointer">
                  {post.title}
                </h4>
                <p className="text-slate-600 mb-4 leading-relaxed line-clamp-2">
                  {post.preview}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {post.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-100">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex gap-6">
                    <button 
                      onClick={() => handleUpvote(post.id)}
                      className={`flex items-center gap-2 text-sm font-medium transition-colors ${!isLoggedIn ? 'cursor-not-allowed opacity-50' : 'hover:text-primary-600'} ${post.upvotes > 20 ? 'text-slate-700' : 'text-slate-500'}`}
                      title={!isLoggedIn ? "Log in to upvote" : "Upvote"}
                    >
                      <ThumbsUp size={18} /> {post.upvotes}
                    </button>
                    <button className={`flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors ${!isLoggedIn ? 'cursor-not-allowed opacity-50' : 'hover:text-primary-600'}`}>
                      <MessageCircle size={18} /> {post.replies} Replies
                    </button>
                  </div>
                  
                  {isLoggedIn ? (
                    <button 
                      onClick={() => handleFollow(post.id)}
                      className={`text-sm font-bold flex items-center gap-2 transition-colors ${post.isFollowing ? 'text-primary-600' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                      {post.isFollowing ? 'Following' : 'Follow Thread'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Lock size={12} /> Log in to reply
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0 space-y-8">
            {/* Team Finder Widget */}
            <div className="bg-primary-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-bold text-lg mb-2">Build your Dream Team</h4>
                <p className="text-primary-100 text-sm mb-6">Find co-founders, engineers, and researchers for your next project.</p>
                <Button variant="white" size="sm" fullWidth className="mb-3">Find a Team</Button>
                <Button variant="outline" size="sm" fullWidth className="border-white/20 text-white hover:bg-white/10">Post a Role</Button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-500/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            </div>

            {/* Mentor Spotlight */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-900">Featured Mentors</h4>
                <a href="#" className="text-xs font-bold text-primary-600 hover:underline">View All</a>
              </div>
              <div className="space-y-4">
                {MENTORS.slice(0, 3).map((mentor, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img src={mentor.image} alt={mentor.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{mentor.name}</p>
                        <CheckCircle size={12} className="text-primary-500 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-500 truncate">{mentor.specialty}</p>
                    </div>
                    {isLoggedIn && (
                      <button className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-full hover:text-primary-600 transition-colors">
                        <UserPlus size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
               <div className="flex items-center gap-2 mb-3 text-slate-800">
                 <Shield size={18} />
                 <h4 className="font-bold text-sm">Community Guidelines</h4>
               </div>
               <p className="text-xs text-slate-500 leading-relaxed mb-3">
                 GIVA is a professional ecosystem. We prioritize constructive feedback, scientific integrity, and respectful collaboration.
               </p>
               <a href="#" className="text-xs font-bold text-slate-600 hover:text-primary-600 flex items-center gap-1">
                 Read Code of Conduct <ArrowRight size={12} />
               </a>
            </div>
          </div>
        </div>
      </Section>

      {/* 4. Partner Presence */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 block">Supported By Global Leaders</span>
          <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Mock Partner Logos using text for simplicity in this demo */}
             {['TechGlobal', 'BioScience Institute', 'FutureFund VC', 'DeepMind Research', 'OpenAI'].map((partner, i) => (
               <span key={i} className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <div className="w-6 h-6 bg-slate-800 rounded-full"></div> {partner}
               </span>
             ))}
          </div>
        </div>
      </section>

      {/* 5. CTA Section (State Aware) */}
      <section className="py-24 bg-primary-900 relative overflow-hidden">
        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {isLoggedIn ? "Ready to start your next project?" : "Join the global innovation ecosystem."}
          </h2>
          <p className="text-primary-100 max-w-2xl mx-auto text-lg mb-10 leading-relaxed">
            {isLoggedIn 
              ? "Launch a team, apply for a grant, or find a mentor to guide your journey." 
              : "Create your profile today to access exclusive discussions, resources, and funding opportunities."}
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="white" size="lg" onClick={() => navigate(isLoggedIn ? '/ecosystem' : '/join')}>
              {isLoggedIn ? "Go to Dashboard" : "Get Started"}
            </Button>
            {!isLoggedIn && (
               <Button variant="outline" size="lg" className="text-white border-white hover:bg-white/10">
                 Browse as Guest
               </Button>
            )}
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
      </section>
    </div>
  );
};

export default CommunityPage;
