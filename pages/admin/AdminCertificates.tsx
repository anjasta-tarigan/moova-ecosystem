import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Award, Plus, RefreshCw, ChevronRight, Clock } from "lucide-react";
import { getAdminCertificates } from "../../services/api/adminApi";

interface EventCertGroup {
  eventId: string | null;
  eventTitle: string;
  total: number;
  active: number;
  revoked: number;
  lastIssued: string | null;
}

const AdminCertificates: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<EventCertGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAdminCertificates({ limit: 500 });
      const certs = res.data.data ?? [];
      const map = new Map<string, EventCertGroup>();

      certs.forEach((c: any) => {
        const key = c.eventId ?? "__none__";
        const title = c.event?.title ?? "General / No Event";
        if (!map.has(key)) {
          map.set(key, {
            eventId: c.eventId ?? null,
            eventTitle: title,
            total: 0,
            active: 0,
            revoked: 0,
            lastIssued: null,
          });
        }
        const g = map.get(key)!;
        g.total++;
        if (c.status === "ACTIVE") g.active++;
        if (c.status === "REVOKED") g.revoked++;
        if (!g.lastIssued || c.issuedAt > g.lastIssued) {
          g.lastIssued = c.issuedAt;
        }
      });

      setGroups(Array.from(map.values()));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Certificates</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Issue and manage certificates grouped by event
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/certificates/create")}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors"
        >
          <Plus size={16} /> Create Certificates
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-slate-300" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-200">
          <Award size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            No Certificates Yet
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Create your first batch for an event.
          </p>
          <button
            onClick={() => navigate("/admin/certificates/create")}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-black transition-colors"
          >
            Create Certificates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {groups.map((g) => (
            <div
              key={g.eventId ?? "general"}
              onClick={() =>
                navigate(
                  g.eventId
                    ? `/admin/certificates/event/${g.eventId}`
                    : "/admin/certificates/event/general",
                )
              }
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 flex flex-col cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                  <Award size={22} />
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-300 group-hover:text-slate-600 transition-colors mt-1"
                />
              </div>
              <h3 className="font-bold text-slate-900 mb-1 leading-snug">
                {g.eventTitle}
              </h3>
              {g.lastIssued && (
                <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
                  <Clock size={11} />
                  Last issued{" "}
                  {new Date(g.lastIssued).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              <div className="mt-auto grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                {[
                  { val: g.total, label: "Total", color: "text-slate-900" },
                  { val: g.active, label: "Active", color: "text-emerald-600" },
                  { val: g.revoked, label: "Revoked", color: "text-red-500" },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCertificates;
