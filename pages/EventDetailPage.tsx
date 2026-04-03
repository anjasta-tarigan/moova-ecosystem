import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import {
  Calendar,
  MapPin,
  Share2,
  Clock,
  Globe,
  Users,
  FileText,
  CheckCircle,
  ChevronDown,
  Download,
  Bookmark,
  Link as LinkIcon,
  Check,
  Trophy,
  Target,
  Layers,
  Lock,
  ThumbsUp,
  MessageCircle,
  Send,
  X,
  Linkedin,
  Twitter,
  User,
  Heart,
} from "lucide-react";
import { eventsApi } from "../services/api/eventsApi";
import { formatDate } from "../lib/utils";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuthContext } from "../contexts/AuthContext";

type ApiTimeline = {
  id: string;
  date: string;
  title: string;
  description: string;
  order: number;
};
type ApiFaq = { id: string; question: string; answer: string; order: number };
type ApiCategory = { id: string; name: string; description: string };
type ApiEvent = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  theme: string;
  date: string;
  location: string;
  format: string;
  category: string;
  image: string;
  status: string;
  deadline: string;
  registrationEndDate?: string | null;
  isRegistrationOpen?: boolean;
  fee: string;
  teamSizeMin: number;
  teamSizeMax: number;
  eligibility: string[];
  sdgs: number[];
  prizePool: string;
  organizer: string;
  categories?: ApiCategory[];
  timeline?: ApiTimeline[];
  faqs?: ApiFaq[];
  _count?: { registrations?: number };
  totalParticipants?: number;
  totalSaves?: number;
  isSaved?: boolean;
  isRegistered?: boolean;
};

type Judge = {
  id: string;
  name: string;
  role?: string;
  org?: string;
  img?: string;
  bio?: string;
  expertise?: string[];
  socials?: { linkedin?: string; twitter?: string };
};

type Question = {
  id: string;
  text?: string;
  question?: string;
  upvotes?: number;
  replies?: {
    id?: string;
    text?: string;
    answer?: string;
    user?: { fullName?: string };
  }[];
  user?: { fullName?: string };
  createdAt?: string;
};

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isRegistered, setIsRegistered] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeRuleTab, setActiveRuleTab] = useState(0);

  // Modal State
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);

  // Q&A State
  const [newQuestion, setNewQuestion] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isTogglingUpvote, setIsTogglingUpvote] = useState<string | null>(null);

  const formatStatusLabel = (status: string) => {
    const normalized = status.toUpperCase();
    if (normalized === "OPEN") return "Open";
    if (normalized === "UPCOMING") return "Upcoming";
    if (normalized === "CLOSED") return "Closed";
    return status;
  };

  const formatFormatLabel = (format: string) => {
    const normalized = format.toUpperCase();
    if (normalized === "HYBRID") return "Hybrid";
    if (normalized === "ONLINE") return "Online";
    if (normalized === "IN_PERSON") return "In-Person";
    return format;
  };
  const fetchQuestions = useCallback(async () => {
    if (!id) return;
    try {
      const res = await eventsApi.getQa(id);
      setQuestions(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  const fetchEvent = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!id) return;

      const isSilent = options?.silent === true;
      if (!isSilent) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const res = await eventsApi.getEvent(id);
        const nextEvent = res.data?.data ?? null;
        setEvent(nextEvent);
        setIsSaved(Boolean(nextEvent?.isSaved));
        setIsRegistered(Boolean(nextEvent?.isRegistered));
      } catch (err: any) {
        if (!isSilent) {
          if (err?.response?.status === 404) {
            setError("Event not found");
          } else {
            setError("Failed to load event");
          }
        }
      } finally {
        if (!isSilent) {
          setIsLoading(false);
        }
      }
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;
    void fetchEvent();
    fetchQuestions();
  }, [id, fetchEvent, fetchQuestions]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchEvent({ silent: true });
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [fetchEvent]);

  const registrations =
    event?.totalParticipants ?? event?._count?.registrations ?? 0;
  const totalSaves = event?.totalSaves ?? 0;
  const isRegistrationOpen = Boolean(event?.isRegistrationOpen);
  const deadlineLabel = event?.deadline ? formatDate(event.deadline) : "TBD";
  const dateLabel = event?.date ? formatDate(event.date) : "-";
  const eligibilityLabel = event?.eligibility?.length
    ? event.eligibility.join(", ")
    : "Open to all participants";
  const teamSizeLabel = event
    ? `${event.teamSizeMin}-${event.teamSizeMax} Members`
    : "-";
  const organizerLabel = event?.organizer || "Organizer to be announced";
  const feeLabel = event?.fee || "Free Entry";
  const themeLabel = event?.theme || event?.category || "Theme to be announced";
  const posterImage =
    event?.image ||
    "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1600&q=80";

  const subThemes =
    event?.categories?.map((cat) => ({
      title: cat.name,
      desc: cat.description || "Category track",
      icon: <Layers size={20} />,
    })) || [];

  const judgingCriteria = useMemo(() => {
    if (event?.categories?.length) {
      const weight = Math.max(10, Math.floor(100 / event.categories.length));
      return event.categories.map((cat) => ({
        category: cat.name,
        weight,
        desc: cat.description || "Evaluation focus",
      }));
    }
    return [
      {
        category: "Impact",
        weight: 40,
        desc: "Impact potential of the solution.",
      },
      {
        category: "Feasibility",
        weight: 30,
        desc: "Technical and operational feasibility.",
      },
      {
        category: "Innovation",
        weight: 30,
        desc: "Originality and differentiation.",
      },
    ];
  }, [event?.categories]);

  const requirements = useMemo(() => {
    if (!event) return [] as string[];
    const reqs: string[] = [
      `Team size: ${teamSizeLabel}`,
      `Eligibility: ${eligibilityLabel}`,
    ];
    if (event.prizePool) {
      reqs.push(`Prize pool: ${event.prizePool}`);
    } else {
      reqs.push("Submission requirements will be announced.");
    }
    return reqs;
  }, [eligibilityLabel, event, teamSizeLabel]);

  const rules = useMemo(() => {
    if (event?.faqs?.length) {
      return event.faqs.map((faq) => ({
        title: faq.question,
        content: faq.answer || "Details will be shared soon.",
      }));
    }
    return [
      {
        title: "Team Composition",
        content: "Ensure your team respects the stated size limits.",
      },
      {
        title: "Originality",
        content:
          "All submissions must be original and comply with event guidelines.",
      },
      {
        title: "Conduct",
        content: "Follow the code of conduct throughout the program.",
      },
    ];
  }, [event?.faqs]);

  const resources = [
    { name: "Event_Guidebook.pdf", type: "PDF", size: "2.5 MB" },
    { name: "Submission_Template.docx", type: "DOCX", size: "1.2 MB" },
    { name: "Judging_Rubric.pdf", type: "PDF", size: "0.8 MB" },
  ];

  const judges: Judge[] = [];

  const timelineItems = useMemo(() => {
    if (!event?.timeline) return [] as ApiTimeline[];
    return [...event.timeline].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [event?.timeline]);

  const handleRegister = async () => {
    if (!id) return;
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "STUDENT") {
      setError("Please log in as a Student to register.");
      return;
    }
    if (!isRegistrationOpen) {
      setError("Registration is closed for this event.");
      return;
    }

    try {
      setIsRegistering(true);
      await eventsApi.registerToEvent(id, {});
      setIsRegistered(true);
      setEvent((previous) => {
        if (!previous) return previous;
        const currentParticipants =
          previous.totalParticipants ?? previous._count?.registrations ?? 0;
        return {
          ...previous,
          totalParticipants: currentParticipants + 1,
        };
      });
    } catch (err) {
      const message =
        (err as any)?.response?.data?.message || "Failed to register for event";
      setError(message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePostQuestion = async () => {
    if (!id || !newQuestion.trim()) return;
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setIsSubmittingQuestion(true);
      await eventsApi.postQuestion(id, newQuestion.trim());
      setNewQuestion("");
      await fetchQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleToggleUpvote = async (questionId: string) => {
    if (!id) return;
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      setIsTogglingUpvote(questionId);
      await eventsApi.toggleUpvote(id, questionId);
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, upvotes: (q.upvotes || 0) + 1 } : q,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglingUpvote(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEvent = async () => {
    if (!event || isBookmarkPending) return;

    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "STUDENT") {
      setError("Only students can save events.");
      return;
    }

    const previousSaved = isSaved;
    const nextSaved = !previousSaved;

    setIsSaved(nextSaved);
    setEvent((previous) => {
      if (!previous) return previous;
      const baseTotal = previous.totalSaves ?? 0;
      return {
        ...previous,
        totalSaves: Math.max(0, baseTotal + (nextSaved ? 1 : -1)),
      };
    });

    try {
      setIsBookmarkPending(true);
      const response = nextSaved
        ? await eventsApi.bookmarkEvent(event.id)
        : await eventsApi.unbookmarkEvent(event.id);

      const payload = response.data?.data ?? {};
      const resolvedSaved =
        typeof payload.isSaved === "boolean" ? payload.isSaved : nextSaved;

      setIsSaved(resolvedSaved);
      setEvent((previous) => {
        if (!previous) return previous;
        const fallbackTotal = previous.totalSaves ?? 0;
        return {
          ...previous,
          totalSaves:
            typeof payload.totalSaves === "number"
              ? payload.totalSaves
              : fallbackTotal,
        };
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to update saved event state";
      setError(message);
      setIsSaved(previousSaved);
      setEvent((previous) => {
        if (!previous) return previous;
        const baseTotal = previous.totalSaves ?? 0;
        return {
          ...previous,
          totalSaves: Math.max(0, baseTotal + (previousSaved ? 1 : -1)),
        };
      });
    } finally {
      setIsBookmarkPending(false);
    }
  };

  const QuickInfoCard = ({
    icon,
    label,
    value,
    subValue,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
  }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm text-center h-full hover:border-primary-200 transition-colors">
      <div className="mb-2 text-primary-600">{icon}</div>
      <div className="text-lg font-bold text-slate-900 leading-tight">
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-slate-400 font-medium mb-1">
          {subValue}
        </div>
      )}
      <div className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
        {label}
      </div>
    </div>
  );

  const SectionHeading = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <div className="mb-8">
      <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="text-slate-500 mt-2">{subtitle}</p>}
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900">{error}</h2>
        <button
          onClick={() => navigate("/events")}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black"
        >
          Back to Events
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900">Event not found</h2>
        <button
          onClick={() => navigate("/events")}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-black"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-24 lg:pb-0 font-sans text-slate-900">
      {/* 1. HERO HEADER */}
      <section className="relative bg-primary-900 text-white pt-10 pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
        {/* Background Visuals */}
        <img
          src={
            event.image ||
            "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1600&q=80"
          }
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-linear-to-b from-primary-900/90 via-primary-900/80 to-slate-50"></div>
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-10 pointer-events-none"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl relative z-10">
          <button
            onClick={() => navigate("/events")}
            className="flex items-center gap-2 text-primary-200 hover:text-white mb-8 transition-colors text-sm font-medium"
          >
            <ChevronDown className="rotate-90" size={16} /> Back to Events
          </button>

          <div className="flex flex-col lg:flex-row gap-8 lg:items-end">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-3 mb-6">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-primary-900`}
                >
                  {formatFormatLabel(event.format)}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary-500 text-white">
                  {event.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30 text-white/80">
                  {formatStatusLabel(event.status)}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                {event.title}
              </h1>
              <p className="text-lg md:text-xl text-primary-100 max-w-2xl leading-relaxed font-light mb-8">
                {event.shortDescription}
              </p>

              {/* Key Meta */}
              <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm font-medium text-primary-200">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-secondary-400" />
                  <span>{dateLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-secondary-400" />
                  <span>Deadline: {deadlineLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-secondary-400" />
                  <span>By {organizerLabel}</span>
                </div>
              </div>
            </div>

            {/* Desktop Hero Actions */}
            <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0 pb-2">
              <Button
                size="lg"
                className="w-full shadow-xl shadow-primary-900/50"
                onClick={() =>
                  document
                    .getElementById("register-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Register Now
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
              >
                <Download size={18} className="mr-2" /> Guidebook
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-12 lg:px-20 max-w-7xl -mt-12 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* MAIN CONTENT COLUMN */}
          <div className="flex-1 min-w-0 space-y-12 pb-24">
            {/* 2. UPDATED QUICK INFO GRID */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Counter 1 */}
              <QuickInfoCard
                icon={<Users />}
                label="Registered"
                value={registrations}
                subValue="Participants"
              />
              {/* Counter 2 */}
              <QuickInfoCard
                icon={<Bookmark />}
                label="Interested"
                value={totalSaves}
                subValue="Saves"
              />
              {/* Eligibility */}
              <QuickInfoCard
                icon={<CheckCircle />}
                label="Eligibility"
                value={eligibilityLabel}
              />

              <QuickInfoCard
                icon={<Users />}
                label="Team Size"
                value={teamSizeLabel}
              />
              <QuickInfoCard
                icon={<Target />}
                label="Entry Fee"
                value={feeLabel}
              />
              <QuickInfoCard
                icon={<Globe />}
                label="Access"
                value={formatFormatLabel(event.format)}
              />
            </div>

            {/* 3. EVENT DESCRIPTION, THEME, TRACKS */}
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-10">
              {/* Description */}
              <div>
                <SectionHeading title="Event Description" />
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                  {event.fullDescription}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Theme */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Core Theme
                </h3>
                <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100">
                  <h4 className="text-2xl font-bold text-primary-700 mb-2">
                    "{themeLabel}"
                  </h4>
                  <p className="text-primary-800/70 text-sm">
                    All submissions must align with this central theme to be
                    considered for evaluation.
                  </p>
                </div>
              </div>

              {/* Tracks */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  Sub-Themes & Tracks
                </h3>
                {subThemes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subThemes.map((track, i) => (
                      <div
                        key={i}
                        className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-primary-300 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary-600 shadow-sm group-hover:scale-110 transition-transform">
                            {track.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm mb-1">
                              {track.title}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {track.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600">
                    Tracks will be announced soon.
                  </div>
                )}
              </div>
            </section>

            {/* 4. JUDGING & GRADING CRITERIA */}
            <section>
              <SectionHeading
                title="Judging & Grading Criteria"
                subtitle="How your submission will be evaluated."
              />
              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                {judgingCriteria.length > 0 ? (
                  <div className="space-y-6">
                    {judgingCriteria.map((crit, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-end mb-2">
                          <div>
                            <div className="font-bold text-slate-900">
                              {crit.category}
                            </div>
                            <div className="text-xs text-slate-500">
                              {crit.desc}
                            </div>
                          </div>
                          <div className="font-bold text-primary-600 text-lg">
                            {crit.weight}%
                          </div>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-brand-gradient h-2 rounded-full"
                            style={{ width: `${crit.weight}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Judging criteria will be published soon.
                  </p>
                )}
              </div>
            </section>

            {/* 5. TIMELINE */}
            <section>
              <SectionHeading
                title="Event Timeline"
                subtitle="Key dates and milestones you need to know."
              />
              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-10">
                  {timelineItems.map((item, idx) => (
                    <div key={item.id || idx} className="relative pl-8">
                      <div
                        className={`absolute -left-2.25 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          idx === 0 ? "bg-primary-600" : "bg-slate-300"
                        }`}
                      ></div>
                      <span className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-1 block">
                        {formatDate(item.date)}
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 mb-2">
                        {item.title}
                      </h4>
                      <p className="text-slate-600 text-sm">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 6. AWARDS (Conditional) */}
            {event.prizePool && (
              <section className="bg-linear-to-br from-slate-900 to-primary-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern-dark opacity-10 pointer-events-none"></div>
                <div className="relative z-10 text-center">
                  <Trophy size={48} className="mx-auto mb-6 text-yellow-400" />
                  <h3 className="text-3xl font-bold mb-4">
                    Awards & Recognition
                  </h3>
                  <p className="text-primary-200 mb-10 max-w-lg mx-auto">
                    Prize pool: {event.prizePool}. Top performing teams will
                    receive funding, incubation support, and global media
                    coverage.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                      <div className="text-yellow-400 font-bold text-xl mb-1">
                        1st Place
                      </div>
                      <div className="text-2xl font-bold mb-2">$25,000</div>
                      <div className="text-xs text-primary-200">
                        Grant + Incubation
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                      <div className="text-slate-300 font-bold text-xl mb-1">
                        2nd Place
                      </div>
                      <div className="text-2xl font-bold mb-2">$15,000</div>
                      <div className="text-xs text-primary-200">
                        Grant + Mentorship
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                      <div className="text-amber-600 font-bold text-xl mb-1">
                        3rd Place
                      </div>
                      <div className="text-2xl font-bold mb-2">$10,000</div>
                      <div className="text-xs text-primary-200">
                        Grant + Perks
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 7. REQUIREMENTS (Checklist UI) */}
            <section>
              <SectionHeading title="Submission Requirements" />
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {requirements.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-slate-700 font-medium">{req}</span>
                    <CheckCircle className="ml-auto text-slate-300" size={18} />
                  </div>
                ))}
              </div>
            </section>

            {/* 8. RULES & ELIGIBILITY */}
            <section>
              <SectionHeading title="Rules & Eligibility" />
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex flex-col gap-2">
                  {rules.map((rule, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveRuleTab(idx)}
                      className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        activeRuleTab === idx
                          ? "bg-primary-600 text-white shadow-md"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {rule.title}
                    </button>
                  ))}
                  <button className="text-left px-4 py-3 rounded-xl text-sm font-bold bg-white text-primary-600 border border-primary-200 hover:bg-primary-50 transition-colors flex items-center gap-2">
                    <Download size={16} /> Download Full Rulebook
                  </button>
                </div>
                <div className="flex-1 bg-white p-8 rounded-2xl border border-slate-200 min-h-50">
                  <h4 className="text-xl font-bold text-slate-900 mb-4">
                    {rules[activeRuleTab].title}
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {rules[activeRuleTab].content}
                  </p>
                </div>
              </div>
            </section>

            {/* 9. RESOURCES */}
            <section>
              <SectionHeading title="Resources & Downloads" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resources.map((res, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm group-hover:text-primary-700">
                          {res.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {res.type} • {res.size}
                        </div>
                      </div>
                    </div>
                    <Download
                      size={16}
                      className="text-slate-400 group-hover:text-primary-600"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* 10. PUBLIC Q&A (Replaces FAQ) */}
            <section id="qa">
              <SectionHeading
                title="Public Q&A"
                subtitle="Ask questions and get answers from the organizers and community."
              />

              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                {/* Ask Box */}
                <div className="mb-8">
                  {user ? (
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {(user?.fullName || "ME").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <textarea
                          className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-primary-500 focus:outline-none resize-none text-sm"
                          rows={3}
                          placeholder="Type your question about the event here..."
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            size="sm"
                            className="gap-2"
                            onClick={handlePostQuestion}
                            disabled={
                              !newQuestion.trim() || isSubmittingQuestion
                            }
                          >
                            <Send size={14} />
                            {isSubmittingQuestion
                              ? "Posting..."
                              : "Post Question"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
                      <Lock className="mx-auto text-slate-400 mb-3" size={24} />
                      <h4 className="font-bold text-slate-900 mb-1">
                        Join the conversation
                      </h4>
                      <p className="text-sm text-slate-500 mb-4">
                        Please log in to ask questions or reply to others.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/login")}
                      >
                        Log In
                      </Button>
                    </div>
                  )}
                </div>

                {/* Question List */}
                <div className="space-y-6">
                  {questions.length > 0 ? (
                    questions.map((q) => {
                      const questionText = q.question || q.text || "";
                      const author = q.user?.fullName || "Anonymous";
                      const replies = q.replies || [];
                      return (
                        <div key={q.id} className="group">
                          <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                              {author.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 text-sm">
                                  {author}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {q.createdAt
                                    ? `• ${formatDate(q.createdAt)}`
                                    : ""}
                                </span>
                              </div>
                              <p className="text-slate-700 text-sm mb-3">
                                {questionText}
                              </p>

                              <div className="flex items-center gap-4 mb-4">
                                <button
                                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors disabled:opacity-50"
                                  onClick={() => handleToggleUpvote(q.id)}
                                  disabled={isTogglingUpvote === q.id}
                                >
                                  <ThumbsUp size={14} /> {q.upvotes || 0}
                                </button>
                                <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors">
                                  <MessageCircle size={14} /> Reply
                                </button>
                              </div>

                              {/* Replies */}
                              {replies.length > 0 && (
                                <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                                  {replies.map((reply, i) => (
                                    <div key={i} className="flex gap-3">
                                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-[10px] shrink-0">
                                        {reply.user?.fullName
                                          ?.slice(0, 2)
                                          .toUpperCase() || "EA"}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="font-bold text-slate-800 text-xs">
                                            {reply.user?.fullName ||
                                              "Organizer"}
                                          </span>
                                          <span className="px-1.5 py-0.5 bg-primary-600 text-white text-[9px] font-bold uppercase rounded">
                                            Organizer
                                          </span>
                                        </div>
                                        <p className="text-slate-600 text-xs">
                                          {reply.text || reply.answer || ""}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">
                      No questions yet. Be the first to ask.
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* 11. FINAL CTA */}
            <section className="bg-primary-50 rounded-3xl p-8 md:p-12 text-center border border-primary-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Ready to make your mark?
              </h2>
              <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                Join hundreds of innovators from around the world. Registration
                closes on {deadlineLabel}.
              </p>
              <div className="flex justify-center gap-4">
                <Button
                  size="lg"
                  onClick={handleRegister}
                  disabled={!isRegistrationOpen || isRegistering}
                >
                  {!isRegistrationOpen
                    ? "Registration Closed"
                    : isRegistering
                      ? "Registering..."
                      : "Register Now"}
                </Button>
                <Button
                  variant="white"
                  size="lg"
                  className="border-primary-200 text-primary-700"
                >
                  Contact Organizers
                </Button>
              </div>
            </section>
          </div>

          {/* DESKTOP STICKY SIDEBAR */}
          <div className="hidden lg:block w-90 shrink-0" id="register-section">
            <div className="sticky top-24 space-y-6">
              {/* Registration Card */}
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Status
                    </span>
                    {isRegistered && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        Registered
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`w-3 h-3 rounded-full ${isRegistrationOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}
                    ></div>
                    <span className="font-bold text-xl text-slate-900">
                      {isRegistrationOpen
                        ? "Registration Open"
                        : "Registration Closed"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Closes on{" "}
                    <span className="font-bold text-slate-700">
                      {deadlineLabel}
                    </span>
                  </p>
                </div>

                {isRegistered ? (
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-start gap-3">
                      <CheckCircle
                        className="text-emerald-600 shrink-0 mt-0.5"
                        size={18}
                      />
                      <p className="text-xs text-emerald-800 font-medium">
                        You're all set! Check your dashboard for next steps.
                      </p>
                    </div>
                    <Button fullWidth variant="outline" size="sm">
                      Go to Dashboard
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      fullWidth
                      size="lg"
                      disabled={!isRegistrationOpen || isRegistering}
                      onClick={handleRegister}
                    >
                      {!isRegistrationOpen
                        ? "Closed"
                        : isRegistering
                          ? "Registering..."
                          : "Register for Event"}
                    </Button>
                    <div className="text-center text-xs text-slate-400 mt-2">
                      {feeLabel} • Instant Confirmation
                    </div>
                  </div>
                )}

                <hr className="my-6 border-slate-100" />

                <div className="space-y-3">
                  <button
                    onClick={() => void handleSaveEvent()}
                    disabled={isBookmarkPending}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                      isSaved
                        ? "bg-secondary-50 border-secondary-200 text-secondary-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Bookmark
                      size={16}
                      fill={isSaved ? "currentColor" : "none"}
                    />
                    {isBookmarkPending
                      ? "Saving..."
                      : isSaved
                        ? "Event Saved"
                        : "Save for Later"}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-slate-200 rounded-lg text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    {copied ? (
                      <Check size={16} className="text-emerald-600" />
                    ) : (
                      <LinkIcon size={16} />
                    )}
                    {copied ? "Link Copied" : "Share Event"}
                  </button>
                </div>
              </div>

              {/* Poster Space */}
              <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg relative group aspect-3/4">
                <img
                  src={posterImage}
                  alt="Event Poster"
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                  <span className="text-xs font-bold text-white/60 uppercase mb-1">
                    Official Poster
                  </span>
                  <h4 className="font-bold text-white leading-tight">
                    Download & Share
                  </h4>
                  <button className="mt-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors border border-white/20 w-fit">
                    <Download size={14} className="inline mr-1" /> PDF Version
                  </button>
                </div>
              </div>

              {/* Clickable Judges Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h4 className="font-bold text-slate-900 mb-4">
                  Featured Judges
                </h4>
                <div className="space-y-3">
                  {judges.length === 0 && (
                    <p className="text-sm text-slate-500">
                      Judges to be announced.
                    </p>
                  )}
                  {judges.map((judge) => (
                    <div
                      key={judge.id}
                      onClick={() => setSelectedJudge(judge)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                    >
                      <img
                        src={judge.img}
                        alt={judge.name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-100"
                      />
                      <div>
                        <div className="font-bold text-sm text-slate-900 group-hover:text-primary-600 transition-colors">
                          {judge.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {judge.role}
                        </div>
                      </div>
                      <ChevronDown
                        className="ml-auto text-slate-300 -rotate-90"
                        size={16}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE FIXED BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] safe-area-bottom">
        <div className="flex gap-3">
          <div className="flex-1">
            <Button
              fullWidth
              onClick={handleRegister}
              disabled={isRegistered || !isRegistrationOpen || isRegistering}
            >
              {isRegistered
                ? "Manage"
                : !isRegistrationOpen
                  ? "Closed"
                  : isRegistering
                    ? "Registering..."
                    : "Register Now"}
            </Button>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center w-12 border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            {copied ? (
              <Check size={20} className="text-emerald-600" />
            ) : (
              <Share2 size={20} />
            )}
          </button>
        </div>
      </div>

      {/* JUDGE MODAL */}
      {selectedJudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedJudge(null)}
          ></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="h-24 bg-primary-900 relative">
              <button
                onClick={() => setSelectedJudge(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-8 pb-8 -mt-12">
              <img
                src={selectedJudge.img}
                alt={selectedJudge.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-md mb-4"
              />
              <h3 className="text-2xl font-bold text-slate-900">
                {selectedJudge.name}
              </h3>
              <p className="text-slate-500 font-medium mb-1">
                {selectedJudge.role} at {selectedJudge.org}
              </p>

              <div className="flex gap-3 mt-4 mb-6">
                {selectedJudge.socials.linkedin && (
                  <a
                    href={selectedJudge.socials.linkedin}
                    className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    <Linkedin size={18} />
                  </a>
                )}
                {selectedJudge.socials.twitter && (
                  <a
                    href={selectedJudge.socials.twitter}
                    className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-sky-50 hover:text-sky-500 transition-colors"
                  >
                    <Twitter size={18} />
                  </a>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Bio
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {selectedJudge.bio}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJudge.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-bold rounded-full border border-primary-100"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                <button
                  onClick={() => setSelectedJudge(null)}
                  className="text-sm font-bold text-primary-600 hover:underline"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;
