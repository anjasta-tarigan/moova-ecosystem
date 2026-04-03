import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Heart, MessageCircle, Send } from "lucide-react";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import { eventsApi } from "../services/api/eventsApi";
import { useEventRealtime } from "../hooks/useEventRealtime";

type Thread = {
  id: string;
  title: string;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  author?: {
    fullName?: string;
    profile?: { avatar?: string } | null;
  } | null;
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  likeCount?: number;
  author?: {
    fullName?: string;
    profile?: { avatar?: string } | null;
  } | null;
};

const Avatar: React.FC<{
  fullName?: string;
  avatar?: string | null;
  size?: "sm" | "md";
}> = ({ fullName, avatar, size = "md" }) => {
  const initials = (fullName || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const sizeClass = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={fullName || "User"}
        className={`${sizeClass} rounded-full border border-slate-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center font-bold text-slate-600`}
    >
      {initials}
    </div>
  );
};

const DashboardEventCommunity: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [eventId, setEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const activeThread = useMemo(
    () => threads.find((item) => item.id === activeThreadId) || null,
    [activeThreadId, threads],
  );

  const loadThreads = useCallback(async () => {
    if (!eventId) return;

    const response = await eventsApi.getCommunityThreads(eventId, {
      page: 1,
      limit: 100,
      sort: "top",
    });

    const payload = response.data?.data ?? response.data ?? [];
    const nextThreads = Array.isArray(payload) ? payload : [];
    setThreads(nextThreads);

    if (nextThreads.length > 0 && !activeThreadId) {
      setActiveThreadId(nextThreads[0].id);
    }
  }, [activeThreadId, eventId]);

  const loadMessages = useCallback(async () => {
    if (!eventId || !activeThreadId) {
      setMessages([]);
      return;
    }

    const response = await eventsApi.getCommunityMessages(
      eventId,
      activeThreadId,
    );
    const payload = response.data?.data ?? response.data ?? [];
    setMessages(Array.isArray(payload) ? payload : []);
  }, [activeThreadId, eventId]);

  const loadInitial = useCallback(async () => {
    if (!slug) {
      navigate("/dashboard/events", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const detailResponse = await eventsApi.getStudentEventBySlug(slug);
      const detail = detailResponse.data?.data ?? null;
      if (!detail?.id) {
        throw new Error("Event not found");
      }

      setEventId(detail.id);
      setEventTitle(detail.title || "Event Community");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load event community",
      );
    } finally {
      setLoading(false);
    }
  }, [navigate, slug]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!eventId) return;
    void loadThreads();
  }, [eventId, loadThreads]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const handleRealtimeUpdate = useCallback(
    async (payload: { type?: string }) => {
      if (!payload?.type) return;

      if (
        payload.type.startsWith("event.community.") ||
        payload.type === "event.registration.created"
      ) {
        await Promise.all([loadThreads(), loadMessages()]);
      }
    },
    [loadMessages, loadThreads],
  );

  useEventRealtime(eventId, handleRealtimeUpdate, Boolean(eventId));

  const handleCreateThread = async () => {
    if (!eventId) return;
    if (
      newThreadTitle.trim().length < 5 ||
      newThreadContent.trim().length < 5
    ) {
      return;
    }

    try {
      setIsSubmittingThread(true);
      await eventsApi.createCommunityThread(eventId, {
        title: newThreadTitle.trim(),
        content: newThreadContent.trim(),
      });
      setNewThreadTitle("");
      setNewThreadContent("");
      await loadThreads();
    } finally {
      setIsSubmittingThread(false);
    }
  };

  const handleToggleThreadLike = async (threadId: string) => {
    if (!eventId) return;
    await eventsApi.toggleCommunityThreadLike(eventId, threadId);
    await loadThreads();
  };

  const handleToggleMessageLike = async (messageId: string) => {
    if (!eventId) return;
    await eventsApi.toggleCommunityMessageLike(eventId, messageId);
    await loadMessages();
  };

  const handleReply = async () => {
    if (!eventId || !activeThreadId) return;
    if (replyContent.trim().length < 2) return;

    try {
      setIsSubmittingReply(true);
      await eventsApi.createCommunityMessage(
        eventId,
        activeThreadId,
        replyContent.trim(),
      );
      setReplyContent("");
      await Promise.all([loadThreads(), loadMessages()]);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Event Community</h1>
          <p className="text-sm text-slate-500">{eventTitle}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(`/dashboard/workspace/${slug}`)}
        >
          Back to Workspace
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Start New Thread</h2>

          <label className="block text-sm font-medium text-slate-700">
            Thread Title
            <input
              value={newThreadTitle}
              onChange={(event) => setNewThreadTitle(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Ask a question or share an update"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Content
            <textarea
              value={newThreadContent}
              onChange={(event) => setNewThreadContent(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Write your message"
            />
          </label>

          <Button
            type="button"
            onClick={handleCreateThread}
            disabled={isSubmittingThread}
          >
            {isSubmittingThread ? "Posting..." : "Post Thread"}
          </Button>

          <div className="space-y-3 pt-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Top Threads
            </h3>
            {threads.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Forum Empty
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${
                    activeThreadId === thread.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                  onClick={() => setActiveThreadId(thread.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      fullName={thread.author?.fullName}
                      avatar={thread.author?.profile?.avatar}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {thread.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {thread.author?.fullName || "Unknown"} •{" "}
                        {new Date(thread.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" /> {thread.likeCount || 0}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />{" "}
                      {thread.replyCount || 0}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!activeThread ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
              Select a thread to see replies.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    fullName={activeThread.author?.fullName}
                    avatar={activeThread.author?.profile?.avatar}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">
                      {activeThread.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {activeThread.author?.fullName || "Unknown"} •{" "}
                      {new Date(activeThread.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                      {activeThread.content}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100"
                    onClick={() => handleToggleThreadLike(activeThread.id)}
                  >
                    <Heart className="h-3.5 w-3.5" /> Like
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100"
                    onClick={() => {
                      const field = document.getElementById("reply-field");
                      field?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Reply
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-95 overflow-auto pr-1 border-l-2 border-slate-100 pl-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar
                        fullName={message.author?.fullName}
                        avatar={message.author?.profile?.avatar}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">
                          {message.author?.fullName || "Unknown"} •{" "}
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-slate-800 whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <button
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-100"
                            onClick={() => handleToggleMessageLike(message.id)}
                          >
                            <Heart className="h-3.5 w-3.5" />
                            {message.likeCount || 0}
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-100"
                            onClick={() => {
                              setReplyContent(
                                `@${message.author?.fullName || "Participant"} `,
                              );
                              const field =
                                document.getElementById("reply-field");
                              field?.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }}
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Reply
                <div className="mt-1 flex gap-2">
                  <textarea
                    id="reply-field"
                    rows={2}
                    value={replyContent}
                    onChange={(event) => setReplyContent(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="Write your reply"
                  />
                  <Button
                    type="button"
                    onClick={handleReply}
                    disabled={isSubmittingReply}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </label>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardEventCommunity;
