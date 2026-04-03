import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Bookmark,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  Clock,
  Download,
  FileText,
  Globe,
  Layers,
  Link as LinkIcon,
  Lock,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  ThumbsUp,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { formatDate } from "../lib/utils";
import { eventsApi } from "../services/api/eventsApi";
import { useAuthContext } from "../contexts/AuthContext";
import { useEventRealtime } from "../hooks/useEventRealtime";

type EventTimeline = {
  id: string;
  date: string;
  title: string;
  description: string;
  order: number;
};

type EventFaq = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

type EventCategory = {
  id: string;
  name: string;
  description: string;
};

type EventRegistration = {
  id: string;
  teamId: string | null;
  team?: { id: string; name: string } | null;
};

type StudentEventDetail = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  theme?: string;
  date: string;
  deadline: string;
  location: string;
  format: string;
  category: string;
  image?: string;
  status: string;
  registrationEndDate?: string | null;
  isRegistrationOpen?: boolean;
  isPreRegistrationOpen?: boolean;
  fee: string;
  prizePool?: string;
  organizer?: string;
  teamSizeMin?: number;
  teamSizeMax?: number;
  eligibility?: string[];
  timeline?: EventTimeline[];
  faqs?: EventFaq[];
  categories?: EventCategory[];
  _count?: { registrations?: number };
  totalParticipants?: number;
  totalSaves?: number;
  isSaved?: boolean;
  isRegistered: boolean;
  registrationId?: string | null;
  registration?: EventRegistration | null;
  registrationStatus?: "APPROVED" | "NOT_REGISTERED";
  eventTimelineStatus?: string;
  canEnterWorkspace?: boolean;
  workspacePath?: string | null;
  workspaceFallbackPath?: string;
  workspaceAccessMessage?: string | null;
  submissionId?: string | null;
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

const DashboardEventDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [event, setEvent] = useState<StudentEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isBookmarkPending, setIsBookmarkPending] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeRuleTab, setActiveRuleTab] = useState(0);

  const [newQuestion, setNewQuestion] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isTogglingUpvote, setIsTogglingUpvote] = useState<string | null>(null);

  const fetchEventDetail = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!slug) return;

      const isSilent = options?.silent === true;
      if (!isSilent) {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await eventsApi.getStudentEventBySlug(slug);
        const nextEvent = response.data?.data ?? null;
        setEvent(nextEvent);
        setIsSaved(Boolean(nextEvent?.isSaved));
      } catch (err: any) {
        if (!isSilent) {
          if (err?.response?.status === 404) {
            setError("Event not found");
          } else {
            setError("Failed to load event detail");
          }
        }
      } finally {
        if (!isSilent) {
          setLoading(false);
        }
      }
    },
    [slug],
  );

  useEffect(() => {
    void fetchEventDetail();
  }, [fetchEventDetail]);

  useEffect(() => {
    const navigationState = location.state as {
      workspaceError?: string;
    } | null;

    if (!navigationState?.workspaceError) {
      return;
    }

    setWorkspaceNotice(navigationState.workspaceError);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const fetchQuestions = useCallback(async () => {
    if (!event?.id) return;
    try {
      const response = await eventsApi.getQa(event.id);
      setQuestions(response.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [event?.id]);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  const handleRealtimeUpdate = useCallback(
    (payload: { type?: string }) => {
      if (!payload?.type) return;
      void fetchEventDetail({ silent: true });

      if (payload.type.startsWith("event.community.")) {
        void fetchQuestions();
      }
    },
    [fetchEventDetail, fetchQuestions],
  );

  useEventRealtime(event?.id, handleRealtimeUpdate, Boolean(event?.id));

  const handleRegister = async () => {
    if (
      !event ||
      event.isRegistered ||
      (!event.isRegistrationOpen && !event.isPreRegistrationOpen)
    )
      return;

    setRegistering(true);
    setError(null);
    try {
      const registrationRes = await eventsApi.registerToEvent(event.id, {});
      const registration = registrationRes.data?.data;

      setEvent((prev) => {
        if (!prev) return prev;
        const currentParticipants =
          typeof prev.totalParticipants === "number"
            ? prev.totalParticipants
            : (prev._count?.registrations ?? 0);

        return {
          ...prev,
          isRegistered: true,
          totalParticipants: currentParticipants + 1,
          registrationId: registration?.id ?? prev.registrationId,
          registration: registration
            ? {
                id: registration.id,
                teamId: registration.teamId ?? null,
                team: registration.team ?? null,
              }
            : prev.registration,
        };
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to register for this event";
      setError(message);
    } finally {
      setRegistering(false);
    }
  };

  const timelineItems = useMemo(() => {
    if (!event?.timeline) return [];
    return [...event.timeline].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [event?.timeline]);

  const faqItems = useMemo(() => {
    if (!event?.faqs) return [];
    return [...event.faqs].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [event?.faqs]);

  const deadlineLabel = event?.deadline ? formatDate(event.deadline) : "TBD";
  const dateLabel = event?.date ? formatDate(event.date) : "TBD";

  const registrations =
    event?.totalParticipants ?? event?._count?.registrations ?? 0;
  const totalSaves = event?.totalSaves ?? 0;
  const isRegistrationOpen = Boolean(event?.isRegistrationOpen);
  const isPreRegistrationOpen = Boolean(event?.isPreRegistrationOpen);
  const eligibilityLabel = event?.eligibility?.length
    ? event.eligibility.join(", ")
    : "Open to all participants";
  const teamSizeLabel =
    event?.teamSizeMin && event?.teamSizeMax
      ? `${event.teamSizeMin}-${event.teamSizeMax} Members`
      : "To be announced";
  const organizerLabel = event?.organizer || "Organizer to be announced";
  const feeLabel = event?.fee || "Free Entry";
  const themeLabel = event?.theme || event?.category || "Theme to be announced";
  const posterImage =
    event?.image ||
    "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1600&q=80";

  const subThemes =
    event?.categories?.map((category) => ({
      title: category.name,
      desc: category.description || "Category track",
      icon: <Layers size={20} />,
    })) || [];

  const judgingCriteria = useMemo(() => {
    if (event?.categories?.length) {
      const weight = Math.max(10, Math.floor(100 / event.categories.length));
      return event.categories.map((category) => ({
        category: category.name,
        weight,
        desc: category.description || "Evaluation focus",
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

    const result = [
      `Team size: ${teamSizeLabel}`,
      `Eligibility: ${eligibilityLabel}`,
    ];

    if (event.prizePool) {
      result.push(`Prize pool: ${event.prizePool}`);
    } else {
      result.push("Submission requirements will be announced.");
    }

    return result;
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

  const handlePostQuestion = async () => {
    if (!event?.id || !newQuestion.trim()) return;

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setIsSubmittingQuestion(true);
      await eventsApi.postQuestion(event.id, newQuestion.trim());
      setNewQuestion("");
      await fetchQuestions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleToggleUpvote = async (questionId: string) => {
    if (!event?.id) return;

    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setIsTogglingUpvote(questionId);
      await eventsApi.toggleUpvote(event.id, questionId);
      setQuestions((previous) =>
        previous.map((question) =>
          question.id === questionId
            ? { ...question, upvotes: (question.upvotes || 0) + 1 }
            : question,
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
      const baseTotalSaves = previous.totalSaves ?? 0;
      return {
        ...previous,
        totalSaves: Math.max(0, baseTotalSaves + (nextSaved ? 1 : -1)),
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
        const baseTotalSaves = previous.totalSaves ?? 0;
        return {
          ...previous,
          totalSaves: Math.max(0, baseTotalSaves + (previousSaved ? 1 : -1)),
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

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !event) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center flex-col gap-4 bg-slate-50 rounded-3xl border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">
          {error || "Event not found"}
        </h2>
        <Button onClick={() => navigate("/dashboard/events")}>
          Back to Event Hub
        </Button>
      </div>
    );
  }

  const canEnterWorkspace = Boolean(event.canEnterWorkspace);

  const handleEnterWorkspace = () => {
    if (!event?.slug) return;
    navigate(`/dashboard/workspace/${event.slug}`);
  };

  const ctaButton = () => {
    if (!event.isRegistered) {
      if (!isRegistrationOpen && !isPreRegistrationOpen) {
        return (
          <Button size="lg" disabled>
            Registration Closed
          </Button>
        );
      }

      return (
        <Button size="lg" onClick={handleRegister} disabled={registering}>
          {registering
            ? "Processing..."
            : isPreRegistrationOpen
              ? "Pre-register"
              : "Register for Event"}
        </Button>
      );
    }

    if (canEnterWorkspace) {
      return (
        <Button size="lg" onClick={handleEnterWorkspace}>
          Enter Workspace
        </Button>
      );
    }

    return (
      <Button size="lg" disabled>
        {event.workspaceAccessMessage || "Workspace Locked"}
      </Button>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans text-slate-900 rounded-3xl overflow-hidden border border-slate-200">
      <section className="relative bg-primary-900 text-white pt-10 pb-16 lg:pt-14 lg:pb-20 overflow-hidden">
        <img
          src={
            event.image ||
            "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1600&q=80"
          }
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-linear-to-b from-primary-900/90 via-primary-900/85 to-slate-50" />

        <div className="relative z-10 px-6 md:px-10 lg:px-14 max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/dashboard/events")}
            className="flex items-center gap-2 text-primary-200 hover:text-white mb-8 transition-colors text-sm font-medium"
          >
            <ChevronLeft size={16} /> Back to Event Hub
          </button>

          {workspaceNotice && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/95 px-4 py-3 text-sm font-medium text-amber-900">
              {workspaceNotice}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8 lg:items-end">
            <div className="flex-1">
              <div className="flex flex-wrap gap-3 mb-5">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-primary-900">
                  {formatFormatLabel(event.format)}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary-500 text-white">
                  {event.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/30 text-white/80">
                  {formatStatusLabel(event.status)}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight">
                {event.title}
              </h1>
              <p className="text-base md:text-lg text-primary-100 max-w-2xl leading-relaxed mb-7">
                {event.shortDescription}
              </p>

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
                  <span>By {event.organizer || "Organizer"}</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-3 w-72 shrink-0">
              {ctaButton()}
            </div>
          </div>
        </div>
      </section>

      <div className="px-6 md:px-10 lg:px-14 max-w-7xl mx-auto -mt-10 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 space-y-12 pb-24">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <QuickInfoCard
                icon={<Users />}
                label="Registered"
                value={registrations}
                subValue="Participants"
              />
              <QuickInfoCard
                icon={<Bookmark />}
                label="Interested"
                value={totalSaves}
                subValue="Saves"
              />
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

            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-10">
              <div>
                <SectionHeading title="Event Description" />
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
                  {event.fullDescription}
                </div>
              </div>

              <hr className="border-slate-100" />

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

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6">
                  Sub-Themes & Tracks
                </h3>
                {subThemes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subThemes.map((track, index) => (
                      <div
                        key={index}
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

            <section>
              <SectionHeading
                title="Judging & Grading Criteria"
                subtitle="How your submission will be evaluated."
              />
              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <div className="space-y-6">
                  {judgingCriteria.map((criterion, index) => (
                    <div key={index}>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <div className="font-bold text-slate-900">
                            {criterion.category}
                          </div>
                          <div className="text-xs text-slate-500">
                            {criterion.desc}
                          </div>
                        </div>
                        <div className="font-bold text-primary-600 text-lg">
                          {criterion.weight}%
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-brand-gradient h-2 rounded-full"
                          style={{ width: `${criterion.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <SectionHeading
                title="Event Timeline"
                subtitle="Key dates and milestones you need to know."
              />
              <div className="bg-white rounded-3xl border border-slate-200 p-8">
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-10">
                  {timelineItems.map((item, index) => (
                    <div key={item.id || index} className="relative pl-8">
                      <div
                        className={`absolute -left-2.25 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                          index === 0 ? "bg-primary-600" : "bg-slate-300"
                        }`}
                      />
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

            {event.prizePool && (
              <section className="bg-linear-to-br from-slate-900 to-primary-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-pattern-dark opacity-10 pointer-events-none" />
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

            <section>
              <SectionHeading title="Submission Requirements" />
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                {requirements.map((requirement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-slate-700 font-medium">
                      {requirement}
                    </span>
                    <CheckCircle className="ml-auto text-slate-300" size={18} />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionHeading title="Rules & Eligibility" />
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 flex flex-col gap-2">
                  {rules.map((rule, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveRuleTab(index)}
                      className={`text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        activeRuleTab === index
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

            <section>
              <SectionHeading title="Resources & Downloads" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resources.map((resource, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-primary-400 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm group-hover:text-primary-700">
                          {resource.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {resource.type} • {resource.size}
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

            <section id="qa">
              <SectionHeading
                title="Public Q&A"
                subtitle="Ask questions and get answers from the organizers and community."
              />
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
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
                          onChange={(eventTarget) =>
                            setNewQuestion(eventTarget.target.value)
                          }
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

                <div className="space-y-6">
                  {questions.length > 0 ? (
                    questions.map((question) => {
                      const questionText =
                        question.question || question.text || "";
                      const author = question.user?.fullName || "Anonymous";
                      const replies = question.replies || [];
                      return (
                        <div key={question.id} className="group">
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
                                  {question.createdAt
                                    ? `• ${formatDate(question.createdAt)}`
                                    : ""}
                                </span>
                              </div>
                              <p className="text-slate-700 text-sm mb-3">
                                {questionText}
                              </p>

                              <div className="flex items-center gap-4 mb-4">
                                <button
                                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors disabled:opacity-50"
                                  onClick={() =>
                                    handleToggleUpvote(question.id)
                                  }
                                  disabled={isTogglingUpvote === question.id}
                                >
                                  <ThumbsUp size={14} /> {question.upvotes || 0}
                                </button>
                                <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors">
                                  <MessageCircle size={14} /> Reply
                                </button>
                              </div>

                              {replies.length > 0 && (
                                <div className="bg-slate-50 rounded-lg p-3 space-y-3">
                                  {replies.map((reply, index) => (
                                    <div key={index} className="flex gap-3">
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

            <section className="bg-primary-50 rounded-3xl p-8 md:p-12 text-center border border-primary-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Ready to make your mark?
              </h2>
              <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                Join hundreds of innovators from around the world. Registration
                closes on {deadlineLabel}.
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                {ctaButton()}
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

          <div className="hidden lg:block w-90 shrink-0" id="register-section">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Status
                    </span>
                    {event.isRegistered && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        Registered
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isRegistrationOpen
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-slate-300"
                      }`}
                    />
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

                <div className="space-y-3">{ctaButton()}</div>

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

              <div className="bg-white rounded-3xl border border-slate-200 p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">FAQs</h3>
                {faqItems.length === 0 ? (
                  <p className="text-slate-500 text-sm">
                    FAQ details will be published soon.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {faqItems.map((faq) => (
                      <div
                        key={faq.id}
                        className="border border-slate-200 rounded-xl p-4"
                      >
                        <p className="font-bold text-slate-900">
                          {faq.question}
                        </p>
                        <p className="text-slate-600 text-sm mt-2 whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] safe-area-bottom">
        <div className="flex gap-3">
          <div className="flex-1">
            <Button
              fullWidth
              onClick={() => {
                if (!event.isRegistered) {
                  void handleRegister();
                  return;
                }

                if (canEnterWorkspace) {
                  handleEnterWorkspace();
                }
              }}
              disabled={
                registering ||
                (!event.isRegistered && !isRegistrationOpen) ||
                (event.isRegistered && !canEnterWorkspace)
              }
            >
              {event.isRegistered
                ? canEnterWorkspace
                  ? "Enter Workspace"
                  : "Workspace Locked"
                : !isRegistrationOpen
                  ? "Closed"
                  : registering
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
    </div>
  );
};

export default DashboardEventDetail;
