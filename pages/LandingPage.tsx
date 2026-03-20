import React, { useRef, useEffect, useState } from "react";
import Section from "../components/Section";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { eventsApi } from "../services/api/eventsApi";
import {
  ArrowRight,
  Globe,
  Users,
  Zap,
  TrendingUp,
  Rocket,
  Microscope,
  ChevronRight,
  CheckCircle,
  X,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Building2,
  HeartHandshake,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- Animation Hook & Component ---
const useOnScreen = (ref: React.RefObject<Element>, rootMargin = "0px") => {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIntersecting(true);
          observer.disconnect(); // Trigger once
        }
      },
      { rootMargin },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, rootMargin]);
  return isIntersecting;
};

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "none";
}> = ({ children, delay = 0, className = "", direction = "up" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(ref, "-50px");

  const translateClass = direction === "up" ? "translate-y-8" : "";
  const transitionDelay = `${delay}ms`;

  return (
    <div
      ref={ref}
      style={{ transitionDelay }}
      className={`transition-all duration-1000 ease-out ${
        onScreen ? "opacity-100 translate-y-0" : `opacity-0 ${translateClass}`
      } ${className}`}
    >
      {children}
    </div>
  );
};

// --- Data: Stakeholders ---
const STAKEHOLDERS = [
  {
    title: "Students & Innovators",
    desc: "Turn your academic research into a venture. Access funding, find co-founders, and join global challenges.",
    icon: <Rocket size={24} />,
    link: "/programs",
    color: "bg-slate-50 text-slate-900 border-slate-200", // Monochrome Override
  },
  {
    title: "Mentors & Experts",
    desc: "Guide the next generation. Share your expertise, judge competitions, and scout for talent.",
    icon: <Users size={24} />,
    link: "/community",
    color: "bg-slate-50 text-slate-900 border-slate-200",
  },
  {
    title: "Universities & Schools",
    desc: "Provide your students with global opportunities. Integrate our challenges into your curriculum.",
    icon: <GraduationCap size={24} />,
    link: "/partners",
    color: "bg-slate-50 text-slate-900 border-slate-200",
  },
  {
    title: "Companies & Industry",
    desc: "Access de-risked deep tech deal flow. Sponsor challenges to solve your specific R&D problems.",
    icon: <Briefcase size={24} />,
    link: "/partners",
    color: "bg-slate-50 text-slate-900 border-slate-200",
  },
  {
    title: "Communities & NGOs",
    desc: "Partner with us to bring innovation ecosystems to your region. Co-host events and hackathons.",
    icon: <HeartHandshake size={24} />,
    link: "/partners",
    color: "bg-slate-50 text-slate-900 border-slate-200",
  },
];

// --- Data: 17 SDGs (Monochrome Logic with Accent Backgrounds) ---
const ALL_SDGS = [
  {
    id: 1,
    title: "No Poverty",
    color: "bg-slate-900",
    icon: "🌱",
    desc: "End poverty in all its forms everywhere.",
    relevance: "Creating economic opportunity through entrepreneurship.",
    example: "Micro-finance blockchain solutions.",
  },
  {
    id: 2,
    title: "Zero Hunger",
    color: "bg-slate-900",
    icon: "🌾",
    desc: "End hunger, achieve food security and sustainable agriculture.",
    relevance: "AgriTech for arid climates and supply chain optimization.",
    example: "Smart irrigation drone pilots.",
  },
  {
    id: 3,
    title: "Good Health",
    color: "bg-slate-900",
    icon: "❤️",
    desc: "Ensure healthy lives and promote well-being for all.",
    relevance: "MedTech diagnostics and accessible healthcare platforms.",
    example: "AI-driven disease detection apps.",
  },
  {
    id: 4,
    title: "Quality Education",
    color: "bg-slate-900",
    icon: "🎓",
    desc: "Ensure inclusive and equitable quality education.",
    relevance: "EdTech platforms and democratizing access to science.",
    example: "Virtual STEM labs for remote schools.",
  },
  {
    id: 5,
    title: "Gender Equality",
    color: "bg-slate-900",
    icon: "⚖️",
    desc: "Achieve gender equality and empower all women and girls.",
    relevance: "Supporting female founders and bias-free AI.",
    example: "Women in Deep Tech Fellowship.",
  },
  {
    id: 6,
    title: "Clean Water",
    color: "bg-slate-900",
    icon: "💧",
    desc: "Ensure availability and sustainable management of water.",
    relevance: "Water purification hardware and sensing technologies.",
    example: "Low-cost filtration membranes.",
  },
  {
    id: 7,
    title: "Affordable Energy",
    color: "bg-slate-900",
    icon: "⚡",
    desc: "Ensure access to affordable, reliable, sustainable energy.",
    relevance: "Renewable energy storage and grid optimization.",
    example: "Solar-powered cold storage.",
  },
  {
    id: 8,
    title: "Decent Work",
    color: "bg-slate-900",
    icon: "📈",
    desc: "Promote sustained, inclusive and sustainable economic growth.",
    relevance: "Job creation in the knowledge economy.",
    example: "Gig-economy platforms for scientists.",
  },
  {
    id: 9,
    title: "Industry & Innovation",
    color: "bg-slate-900",
    icon: "🏗️",
    desc: "Build resilient infrastructure and foster innovation.",
    relevance: "The core mandate of GIVA: converting science to industry.",
    example: "Sustainable material manufacturing.",
  },
  {
    id: 10,
    title: "Reduced Inequalities",
    color: "bg-slate-900",
    icon: "🤝",
    desc: "Reduce inequality within and among countries.",
    relevance: "Bridging the digital divide via technology transfer.",
    example: "Open-source hardware initiatives.",
  },
  {
    id: 11,
    title: "Sustainable Cities",
    color: "bg-slate-900",
    icon: "🏙️",
    desc: "Make cities and human settlements inclusive and safe.",
    relevance: "Urban mobility, waste management, and smart city tech.",
    example: "Traffic optimization AI.",
  },
  {
    id: 12,
    title: "Consumption",
    color: "bg-slate-900",
    icon: "🔄",
    desc: "Ensure sustainable consumption and production patterns.",
    relevance: "Circular economy models and waste reduction.",
    example: "Plastic recycling innovations.",
  },
  {
    id: 13,
    title: "Climate Action",
    color: "bg-slate-900",
    icon: "🌍",
    desc: "Take urgent action to combat climate change.",
    relevance: "Carbon capture, climate modeling, and resilience tech.",
    example: "Carbon credit verification platforms.",
  },
  {
    id: 14,
    title: "Life Below Water",
    color: "bg-slate-900",
    icon: "🐠",
    desc: "Conserve and sustainably use the oceans.",
    relevance: "Blue economy, ocean cleaning, and aquaculture.",
    example: "Ocean micro-plastic sensors.",
  },
  {
    id: 15,
    title: "Life on Land",
    color: "bg-slate-900",
    icon: "🌳",
    desc: "Protect, restore and promote sustainable use of terrestrial ecosystems.",
    relevance: "Biodiversity monitoring and reforestation tech.",
    example: "Drone-based reforestation.",
  },
  {
    id: 16,
    title: "Peace & Justice",
    color: "bg-slate-900",
    icon: "🕊️",
    desc: "Promote peaceful and inclusive societies.",
    relevance: "Civic tech, transparency tools, and digital rights.",
    example: "Anti-corruption blockchain tools.",
  },
  {
    id: 17,
    title: "Partnerships",
    color: "bg-slate-900",
    icon: "🔗",
    desc: "Strengthen the means of implementation.",
    relevance: "Connecting silos: Academia, Industry, and Government.",
    example: "The Global Science Summit.",
  },
];

// --- Main Page Component ---

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSdg, setSelectedSdg] = useState<(typeof ALL_SDGS)[0] | null>(
    null,
  );
  const [stats, setStats] = useState({
    events: "0",
    programs: "3",
    sdgs: "17",
    phase: "Alpha",
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const statsTicker = [
    { label: "Live Events", value: stats.events },
    { label: "Core Modules", value: stats.programs },
    { label: "SDGs Integrated", value: stats.sdgs },
    { label: "Launch Phase", value: stats.phase },
  ];

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      setIsLoadingStats(true);
      setStatsError(null);
      try {
        const res = await eventsApi.getEvents({ limit: 1 });
        const totalEvents =
          res.data?.pagination?.total ?? res.data?.data?.length ?? 0;
        if (!isMounted) return;
        setStats((prev) => ({ ...prev, events: String(totalEvents || 0) }));
      } catch (err) {
        console.error("Failed to load landing stats", err);
        if (isMounted) setStatsError("Unable to load stats");
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    };

    fetchStats();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col w-full bg-white overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 min-h-[95vh] flex flex-col items-center justify-center overflow-hidden bg-white">
        {/* ATMOSPHERIC ACCENTS (Brand Colors) */}
        {/* Cyan Glow - Top Left */}
        <div
          className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[160px] opacity-20 pointer-events-none"
          style={{ background: "#00BBFF" }}
        ></div>
        {/* Blue Glow - Bottom Right */}
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[900px] h-[900px] rounded-full blur-[180px] opacity-10 pointer-events-none"
          style={{ background: "#0052CC" }}
        ></div>
        {/* Subtle Crimson Pulse */}
        <div
          className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full blur-[120px] opacity-5 pointer-events-none animate-pulse-slow"
          style={{ background: "#DC143C" }}
        ></div>

        {/* Grid Texture */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center flex flex-col items-center w-full min-w-0">
          {/* Tag / Label */}
          <FadeIn delay={100}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 shadow-sm mb-8 cursor-default group hover:border-slate-300 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-900"></span>
              </span>
              <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                The Global Innovation Ecosystem
              </span>
            </div>
          </FadeIn>

          {/* Headline */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <img
              src="/brand.png"
              alt="GIVA"
              className="h-10 w-auto object-contain"
            />
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              GIVA
            </span>
          </div>
          <FadeIn delay={200} className="max-w-5xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold text-slate-900 tracking-tighter mb-8 leading-[1.05] lg:leading-[1]">
              Turn Curiosity Into <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-700 to-black">
                Real-World Impact
              </span>
            </h1>
          </FadeIn>

          {/* Subheadline */}
          <FadeIn delay={300}>
            <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
              GIVA provides the infrastructure for discovery. Connect with
              mentors, secure funding, and collaborate on challenges that shape
              the future.
            </p>
          </FadeIn>

          {/* Buttons (Monochrome) */}
          <FadeIn
            delay={400}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-none sm:w-auto"
          >
            <Button
              size="lg"
              onClick={() => navigate("/join")}
              className="h-14 px-8 text-base w-full sm:w-auto font-bold rounded-full bg-slate-900 text-white hover:bg-black border border-transparent shadow-lg shadow-slate-200/50"
            >
              Create Free Account
            </Button>
            <Button
              variant="white"
              size="lg"
              onClick={() => navigate("/programs")}
              className="h-14 px-8 text-base border border-slate-200 text-slate-900 w-full sm:w-auto group font-bold rounded-full hover:bg-slate-50"
            >
              Explore Programs{" "}
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </FadeIn>

          {/* Stats Ticker */}
          <FadeIn
            delay={600}
            className="mt-20 w-full max-w-5xl border-t border-slate-100 pt-8 relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-xs font-bold text-slate-300 uppercase tracking-widest">
              GIVA in Numbers
            </div>
            {statsError && (
              <div className="text-xs text-red-500 mb-4">{statsError}</div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {statsTicker.map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center"
                >
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
            {isLoadingStats && (
              <div className="absolute right-4 top-4">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION (Cards) */}
      <Section
        id="vision"
        tag="Core Mandate"
        headline="Bridging the gap."
        subheadline="We dismantle the barriers between discovery and deployment through a structured, multi-layered approach."
        className="bg-white relative z-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {[
            {
              icon: <Microscope size={32} />,
              title: "Research Translation",
              desc: "Systematic pathways to move IP from TRL 3 (Proof of Concept) to TRL 7 (System Prototype).",
              glow: "shadow-[0_0_60px_-15px_rgba(0,187,255,0.1)]", // Cyan Tint
            },
            {
              icon: <Globe size={32} />,
              title: "Global Connectivity",
              desc: "Linking emerging market talent with established innovation centers in Europe and North America.",
              glow: "shadow-[0_0_60px_-15px_rgba(0,168,107,0.1)]", // Green Tint
            },
            {
              icon: <TrendingUp size={32} />,
              title: "Sustainable Capital",
              desc: "Directing patient, risk-tolerant capital towards high-impact, science-based ventures.",
              glow: "shadow-[0_0_60px_-15px_rgba(255,191,0,0.1)]", // Amber Tint
            },
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 150} className="h-full">
              <div
                className={`h-full bg-white p-8 rounded-3xl border border-slate-100 ${item.glow} hover:shadow-xl hover:border-slate-300 transition-all duration-500 group cursor-default relative overflow-hidden`}
              >
                <span className="text-4xl font-black text-slate-100 mb-6 block group-hover:text-slate-200 transition-colors">
                  0{i + 1}
                </span>

                <div
                  className={`w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 mb-6 relative z-10 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300`}
                >
                  {item.icon}
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-sm">
                  {item.desc}
                </p>

                <div className="mt-8 pt-6 border-t border-slate-50 flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
                  Learn more{" "}
                  <ChevronRight
                    size={14}
                    className="ml-1 group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* 3. WHO GIVA IS FOR (Stakeholder Cards) */}
      <section className="py-24 bg-slate-50 border-t border-slate-100 relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute left-[-10%] top-[20%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-5 bg-accent-orange pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="max-w-3xl mb-16 text-center md:text-left">
            <FadeIn>
              <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-widest uppercase rounded-full bg-white text-slate-900 border border-slate-200">
                The Ecosystem
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 leading-tight">
                Who GIVA Is For.
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed">
                Innovation requires a village. We've built specific value
                streams for every key player in the scientific value chain.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {STAKEHOLDERS.map((item, i) => (
              <FadeIn key={i} delay={i * 100}>
                <div
                  onClick={() => navigate(item.link)}
                  className="group bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col relative overflow-hidden"
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 relative z-10 bg-slate-100 text-slate-900`}
                  >
                    {item.icon}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {item.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">
                    {item.desc}
                  </p>

                  <div className="flex items-center text-xs font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
                    Learn More{" "}
                    <ArrowRight
                      size={14}
                      className="ml-2 group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </div>
              </FadeIn>
            ))}

            {/* CTA Card for "You" - Dark Card for contrast */}
            <FadeIn delay={500} className="h-full">
              <div
                onClick={() => navigate("/join")}
                className="group bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col justify-center items-center text-center relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-grid-pattern-dark opacity-10 pointer-events-none"></div>

                {/* Internal Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-accent-cyan/10 pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 text-white group-hover:bg-white/20 transition-colors">
                    <Zap size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">You?</h3>
                  <p className="text-slate-300 text-sm mb-6">
                    Don't fit a label? If you are building the future, you
                    belong here.
                  </p>
                  <span className="inline-flex items-center px-4 py-2 bg-white text-slate-900 text-xs font-bold uppercase tracking-wide rounded-full group-hover:bg-slate-200 transition-colors">
                    Join the Community
                  </span>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 4. OUR IMPACT FRAMEWORK (Full SDG Grid) */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-20 pointer-events-none"></div>

        {/* Soft Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent-green rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-blue rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <div className="max-w-4xl mb-12">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-6 backdrop-blur-md">
                <Globe size={14} className="text-white" />
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  Global Agenda
                </span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                Our Impact Framework (SDGs)
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
                We don't just innovate for the sake of it. Every program,
                startup, and challenge within GIVA is mapped to the UN
                Sustainable Development Goals to ensure we are solving problems
                that matter.
              </p>
            </FadeIn>
          </div>

          {/* SDG Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {ALL_SDGS.map((sdg, i) => (
              <FadeIn key={i} delay={Math.min(i * 50, 1000)}>
                <div
                  onClick={() => setSelectedSdg(sdg)}
                  className="aspect-square relative bg-white/5 border border-white/5 backdrop-blur-sm rounded-xl p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 group overflow-hidden"
                >
                  {/* Minimal Color Indicator on Hover */}
                  <div
                    className={`absolute top-0 left-0 w-full h-1 bg-white opacity-0 group-hover:opacity-100 transition-opacity`}
                  ></div>

                  <div className="flex justify-between items-start">
                    <span className="text-xl font-bold text-white/20 group-hover:text-white/60 transition-colors font-mono">
                      {sdg.id}
                    </span>
                    <span className="text-xl filter grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                      {sdg.icon}
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-xs md:text-sm text-white leading-tight block group-hover:text-slate-200 transition-colors">
                      {sdg.title}
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA SECTION */}
      <section className="py-32 bg-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-5"></div>

        {/* Soft Background Pulse */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-slate-900 rounded-full blur-[120px] opacity-5 pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl text-center relative z-10">
          <FadeIn className="max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-10 text-white shadow-xl shadow-slate-900/10 rotate-3 hover:rotate-6 transition-transform duration-500">
              <Zap size={40} />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-8 tracking-tight">
              Ready to shape the future?
            </h2>
            <p className="text-xl text-slate-500 mb-12 leading-relaxed max-w-2xl mx-auto">
              Whether you are a researcher, a founder, or a policy maker, there
              is a place for you in the GIVA ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/join")}
                className="h-16 px-12 text-lg rounded-full"
              >
                Create Free Account
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/events")}
                className="h-16 px-12 text-lg rounded-full bg-white border-slate-200 text-slate-800"
              >
                Browse Events
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-2 text-sm text-slate-400 font-medium">
              <span className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"
                  ></div>
                ))}
              </span>
              <span className="ml-2">
                Join the waitlist for our inaugural cohort.
              </span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SDG Modal / Drawer */}
      {selectedSdg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedSdg(null)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-300 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div
              className={`h-40 bg-slate-900 relative flex flex-col justify-end p-8 text-white shrink-0`}
            >
              <button
                onClick={() => setSelectedSdg(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="absolute top-6 right-8 text-8xl opacity-10">
                {selectedSdg.icon}
              </div>
              <div className="relative z-10">
                <span className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1 block">
                  Goal {selectedSdg.id}
                </span>
                <h3 className="text-4xl font-bold">{selectedSdg.title}</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto">
              <div className="mb-8">
                <h4 className="text-sm font-bold uppercase text-slate-400 mb-2 tracking-wide">
                  Mission
                </h4>
                <p className="text-xl text-slate-900 font-medium leading-relaxed">
                  {selectedSdg.desc}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <h4 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-600 mb-2">
                    <Microscope size={16} /> GIVA Relevance
                  </h4>
                  <p className="text-slate-800 text-sm leading-relaxed">
                    {selectedSdg.relevance}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h4 className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500 mb-2">
                    <Zap size={16} /> Example Initiative
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed italic">
                    "{selectedSdg.example}"
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Button
                  fullWidth
                  onClick={() => {
                    navigate("/programs");
                    setSelectedSdg(null);
                  }}
                >
                  Find Related Programs{" "}
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
