import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/Button";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useEventRealtime } from "../../hooks/useEventRealtime";
import { MANAGE_EVENT_CARDS } from "../../lib/manageEventCards";
import { useAuthContext } from "../../contexts/AuthContext";
import { adminApi } from "../../services/api/adminApi";

type ProgressMap = Record<string, number>;

const renderProgress = (value: number) => {
  const safeValue = Math.max(0, Math.min(100, Number(value || 0)));
  const filledBlocks = Math.round(safeValue / 10);
  return `[${"█".repeat(filledBlocks)}${"░".repeat(10 - filledBlocks)}] ${safeValue}%`;
};

const ManageEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperAdmin } = useAuthContext();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [progress, setProgress] = useState<ProgressMap>({});

  const basePath = useMemo(
    () =>
      location.pathname.startsWith("/superadmin") ? "/superadmin" : "/admin",
    [location.pathname],
  );

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await adminApi.getManageEvent(id);
      const payload = response.data?.data ?? response.data;

      setEventTitle(payload?.title || "Untitled Event");
      setProgress(payload?.progress || {});
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load event");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRealtimeUpdate = useCallback(() => {
    void loadData();
  }, [loadData]);

  useEventRealtime(id, handleRealtimeUpdate, Boolean(id));

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Event</h1>
          <p className="text-sm text-slate-500">{eventTitle}</p>
        </div>
        <Button type="button" onClick={() => navigate(`${basePath}/events`)}>
          Back to Events
        </Button>
      </div>

      {!isSuperAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Readonly mode: Admin can review all event cards but only Superadmin
          can edit configurations.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MANAGE_EVENT_CARDS.map((card) => {
          const progressValue = Number(progress[card.key] || 0);
          return (
            <article
              key={card.key}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {card.key}
              </p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                {card.title}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{card.subtitle}</p>
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                {renderProgress(progressValue)}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() =>
                  navigate(`${basePath}/events/${id}/edit/${card.key}`)
                }
              >
                {isSuperAdmin ? "Open Form" : "View Detail"}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default ManageEvent;
