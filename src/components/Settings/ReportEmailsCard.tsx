"use client";

import React, { useState } from "react";
import { toast } from "react-toastify";
import { Mail, Send, X } from "lucide-react";
import { useAppSelector } from "@/redux/store/hooks";
import {
  useGetReportOptionsQuery,
  useGetReportScheduleQuery,
  useSaveReportScheduleMutation,
  useSendTestReportEmailMutation,
  type ReportSchedule,
} from "@/redux/slices/reportsApiSlice";

type Frequency = ReportSchedule["frequency"];

const MAX_RECIPIENTS = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FREQUENCIES: Frequency[] = ["DAILY", "WEEKLY", "MONTHLY"];

const FREQUENCY_COPY: Record<Frequency, { title: string; when: string }> = {
  DAILY: { title: "Daily report", when: "Every morning at 9 AM: yesterday vs the same day last week" },
  WEEKLY: { title: "Weekly report", when: "Every Monday at 9 AM, covering last week (Mon–Sun)" },
  MONTHLY: { title: "Monthly report", when: "On the 1st at 9 AM, covering last month" },
};

// The API sends { error: { message } }; a plain { message } is still read just in case
const errorMessage = (err: unknown, fallback: string) => {
  const data = (err as { data?: { error?: { message?: string }; message?: string } })?.data;
  return data?.error?.message || data?.message || fallback;
};

/**
 * Owner-only card: weekly and monthly sales reports emailed as a PDF.
 * Both schedules share one recipient list and outlet choice, so owners set them once.
 */
export default function ReportEmailsCard() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: schedules, isLoading, isError, refetch } = useGetReportScheduleQuery();
  const { data: options } = useGetReportOptionsQuery();

  if (isError && !schedules) {
    return (
      <CardShell>
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-red-100 bg-red-50">
          <p className="text-sm text-red-800">Couldn&apos;t load your report email settings.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-3.5 py-2 text-xs font-bold rounded-lg border border-red-200 bg-white text-red-800 hover:bg-red-100 cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      </CardShell>
    );
  }

  if (isLoading || !schedules) {
    return (
      <CardShell>
        <div className="h-32 rounded-xl bg-gray-50 animate-pulse" />
      </CardShell>
    );
  }

  // Saved values seed the form; recipients default to the owner's own email.
  const saved = schedules.find((s) => s.recipients.length > 0);
  const initial: FormValues = {
    enabled: {
      DAILY: schedules.find((s) => s.frequency === "DAILY")?.enabled ?? false,
      WEEKLY: schedules.find((s) => s.frequency === "WEEKLY")?.enabled ?? false,
      MONTHLY: schedules.find((s) => s.frequency === "MONTHLY")?.enabled ?? false,
    },
    recipients: saved?.recipients ?? (user?.email ? [user.email.toLowerCase()] : []),
    outletId: saved?.outletId ?? schedules[0]?.outletId ?? null,
  };

  return <ReportEmailsForm initial={initial} outlets={options?.outlets ?? []} />;
}

interface FormValues {
  enabled: Record<Frequency, boolean>;
  recipients: string[];
  outletId: string | null;
}

function CardShell({ action, children }: { action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#D3232A]" />
            Report Emails
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Get your sales report as a PDF in your inbox, compared with the period before. Times are India time.
          </p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ReportEmailsForm({ initial, outlets }: { initial: FormValues; outlets: { id: string; name: string }[] }) {
  const [saveSchedule, { isLoading: isSaving }] = useSaveReportScheduleMutation();
  const [sendTest, { isLoading: isSendingTest }] = useSendTestReportEmailMutation();

  const [enabled, setEnabled] = useState<Record<Frequency, boolean>>(initial.enabled);
  const [recipients, setRecipients] = useState<string[]>(initial.recipients);
  const [draft, setDraft] = useState("");
  const [outletId, setOutletId] = useState<string | null>(initial.outletId);
  const [dirty, setDirty] = useState(false);
  const addRecipient = () => {
    const email = draft.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_RE.test(email)) return toast.error("Enter a valid email address");
    if (recipients.includes(email)) return setDraft("");
    if (recipients.length >= MAX_RECIPIENTS) return toast.error(`Up to ${MAX_RECIPIENTS} recipients`);
    setRecipients([...recipients, email]);
    setDraft("");
    setDirty(true);
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
    setDirty(true);
  };

  const handleSave = async () => {
    if (recipients.length === 0) return toast.error("Add at least one recipient");
    try {
      for (const frequency of FREQUENCIES) {
        await saveSchedule({ frequency, enabled: enabled[frequency], recipients, outletId }).unwrap();
      }
      setDirty(false);
      toast.success("Report email settings saved");
    } catch (err) {
      toast.error(errorMessage(err, "Could not save report emails"));
    }
  };

  const handleTest = async () => {
    if (dirty) return toast.info("Save your changes first, then send a test");
    try {
      const { sent, reason } = await sendTest({ outletId }).unwrap();
      if (sent) toast.success(`Last week's report sent to ${recipients.join(", ")}`);
      else if (reason === "failed") toast.error("Couldn't send the test email. Please try again in a few minutes.");
      else toast.warn("Email isn't set up on this server yet, so nothing was sent.");
    } catch (err) {
      toast.error(errorMessage(err, "Could not send the test email"));
    }
  };

  return (
    <CardShell
      action={
        <button
          type="button"
          onClick={handleTest}
          disabled={isSendingTest || recipients.length === 0}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg border border-gray-200 text-gray-800 hover:bg-gray-50 disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          {isSendingTest ? "Sending..." : "Send a test now"}
        </button>
      }
    >
      <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FREQUENCIES.map((frequency) => {
              const on = enabled[frequency];
              return (
                <label
                  key={frequency}
                  className={`p-4 rounded-xl border-2 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    on ? "border-[#1B2A4A] bg-[#1B2A4A]/5" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{FREQUENCY_COPY[frequency].title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{FREQUENCY_COPY[frequency].when}</div>
                  </div>
                  <span className="relative inline-flex shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label={FREQUENCY_COPY[frequency].title}
                      checked={on}
                      onChange={(e) => {
                        setEnabled({ ...enabled, [frequency]: e.target.checked });
                        setDirty(true);
                      }}
                      className="peer sr-only"
                    />
                    <span className="h-5 w-9 rounded-full bg-gray-300 peer-checked:bg-emerald-600 transition-colors" />
                    <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                  </span>
                </label>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="report-recipient" className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Send to ({recipients.length}/{MAX_RECIPIENTS})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {recipients.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-800"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      aria-label={`Remove ${email}`}
                      className="p-0.5 rounded-full hover:bg-gray-200 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              {recipients.length < MAX_RECIPIENTS && (
                <div className="flex gap-2">
                  <input
                    id="report-recipient"
                    type="email"
                    value={draft}
                    placeholder="name@example.com"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addRecipient();
                      }
                    }}
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
                  />
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="px-3 py-2 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="report-outlet" className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Outlets covered
              </label>
              <select
                id="report-outlet"
                value={outletId ?? ""}
                onChange={(e) => {
                  setOutletId(e.target.value || null);
                  setDirty(true);
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20"
              >
                <option value="">All outlets combined</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            {dirty && <span className="text-xs text-amber-700">Unsaved changes</span>}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !dirty}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#1B2A4A] text-white hover:bg-[#14203a] disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </>
    </CardShell>
  );
}
