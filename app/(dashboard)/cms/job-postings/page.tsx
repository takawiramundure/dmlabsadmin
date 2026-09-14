"use client";

import { useEffect, useState } from "react";
import PageMeta from "@/components/common/PageMeta";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import { FirestoreService } from "@/services/firestore";
import { useSite } from "@/context/SiteContext";
import { useDialog } from "@/context/DialogContext";
import {
  Briefcase,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Save,
  Check,
  Eye,
  EyeOff,
  Link2,
  ArrowUp,
  ArrowDown,
  AlignLeft
} from "lucide-react";
import { RichTextEditor } from "@/components/form/RichTextEditor";

export interface JobPosting {
  id: string;
  heading: string;
  location: string;
  jobType: string;
  description?: string;
  pdfUrl?: string;
  externalLink?: string;
  buttonUrl?: string;
  enabled?: boolean;
  order?: number;
}

export default function JobPostingsManager() {
  const { currentSite } = useSite();
  const { confirm } = useDialog();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [headerTitle, setHeaderTitle] = useState("Current Job Postings");
  const [headerContent, setHeaderContent] = useState(
    "Join our dedicated team of professionals committed to equity, empowerment, and excellence in community wellness."
  );
  const [listingsHeading, setListingsHeading] = useState("Current Openings");
  const [jobs, setJobs] = useState<JobPosting[]>([]);

  useEffect(() => {
    loadCareers();
  }, [currentSite.id]);

  const loadCareers = async () => {
    setLoading(true);
    setError("");
    try {
      const data: any = await FirestoreService.getPageContent("careers", currentSite.id);
      if (data && data.sections) {
        setHeaderTitle(data.sections.hero?.heading || "Current Job Postings");
        setHeaderContent(
          data.sections.hero?.content ||
            "Join our dedicated team of professionals committed to equity, empowerment, and excellence in community wellness."
        );
        setListingsHeading(data.sections.listings?.heading || "Current Openings");

        const parsedJobs: JobPosting[] = Object.entries(data.sections)
          .filter(([key]) => key.startsWith("job_"))
          .map(([key, sec]: [string, any]) => ({
            id: key,
            heading: sec.heading || "Untitled Position",
            location: sec.location || "Kitchener, ON, Canada",
            jobType: sec.jobType || "Full Time",
            description: sec.description || sec.content || "",
            pdfUrl: sec.pdfUrl || "",
            externalLink: sec.externalLink || "",
            buttonUrl: sec.buttonUrl || "",
            enabled: sec.enabled !== false,
            order: sec.order !== undefined ? Number(sec.order) : 100
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        setJobs(parsedJobs);
      } else {
        setHeaderTitle("Current Job Postings");
        setHeaderContent("Join our dedicated team of professionals committed to community wellness.");
        setListingsHeading("Current Openings");
        setJobs([]);
      }
    } catch (err: any) {
      console.error("Error loading careers:", err);
      setError("Failed to load careers: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const existingData: any = (await FirestoreService.getPageContent("careers", currentSite.id)) || {};
      const existingSections = existingData.sections || {};

      // Retain non-job sections like sidebar, quote, etc.
      const preservedSections: Record<string, any> = {};
      Object.keys(existingSections).forEach((key) => {
        if (!key.startsWith("job_") && key !== "hero" && key !== "listings") {
          preservedSections[key] = existingSections[key];
        }
      });

      const updatedSections: Record<string, any> = {
        ...preservedSections,
        hero: {
          ...(existingSections.hero || {}),
          heading: headerTitle,
          content: headerContent,
          enabled: true,
          order: 0
        },
        listings: {
          ...(existingSections.listings || {}),
          heading: listingsHeading,
          enabled: true,
          order: 10
        }
      };

      jobs.forEach((job, index) => {
        const key = job.id.startsWith("job_") ? job.id : `job_${index + 1}`;
        updatedSections[key] = {
          heading: job.heading,
          location: job.location,
          jobType: job.jobType,
          description: job.description || "",
          pdfUrl: job.pdfUrl || "",
          externalLink: job.externalLink || "",
          buttonUrl: job.buttonUrl || (job.pdfUrl ? "" : "mailto:info@kindmindsfamilywellness.org"),
          enabled: job.enabled !== false,
          order: (index + 2) * 10
        };
      });

      const fullPayload = {
        ...existingData,
        title: "Careers",
        sections: updatedSections,
        lastUpdated: new Date().toISOString()
      };

      await FirestoreService.savePageContent("careers", fullPayload, currentSite.id);
      setSuccessMsg("Job postings and career vacancies saved and published successfully!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err: any) {
      console.error("Error saving job postings:", err);
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addJob = () => {
    const newIdx = jobs.length + 1;
    const newJob: JobPosting = {
      id: `job_${Date.now()}`,
      heading: "New Position Title",
      location: "Kitchener, ON, Canada",
      jobType: "Full Time",
      pdfUrl: "",
      externalLink: "",
      buttonUrl: "mailto:info@kindmindsfamilywellness.org",
      enabled: true,
      order: (newIdx + 2) * 10
    };
    setJobs([...jobs, newJob]);
  };

  const removeJob = async (index: number) => {
    const target = jobs[index];
    const isConfirmed = await confirm({
      title: "Remove Position",
      message: `Are you sure you want to remove "${target.heading}"?`,
      variant: "danger",
      confirmLabel: "Remove"
    });
    if (!isConfirmed) return;

    setJobs(jobs.filter((_, i) => i !== index));
  };

  const updateJob = (index: number, field: keyof JobPosting, value: any) => {
    setJobs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const moveJob = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= jobs.length) return;

    const copy = [...jobs];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setJobs(copy);
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title={`Job Postings & Vacancies - ${currentSite.name} | Admin Portal`}
        description="Manage organization job openings, career descriptions, PDF uploads, and application portal links."
      />

      <div className="flex flex-col min-h-[calc(100vh-80px)] rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 shadow-xl overflow-hidden">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Job Postings & Vacancies
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-500/20">
                  Global Component
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage job descriptions, PDF attachments, and application portal links for {currentSite.name}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`http://localhost:3002/join/careers`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink size={14} /> View Live Careers
            </a>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs shadow-md shadow-indigo-500/20"
            >
              <Save size={15} />
              {saving ? "Publishing..." : "Save & Publish"}
            </Button>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 text-xs px-6 font-semibold">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs px-6 font-semibold flex items-center gap-2">
            <Check size={16} /> {successMsg}
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto w-full">
          {/* Section 1: Header / Banner Info */}
          <div className="p-6 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Link2 size={16} className="text-indigo-600" /> Careers Page Header
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Header Title
                </Label>
                <Input
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  placeholder="Current Job Postings"
                  className="h-10 text-sm font-semibold rounded-xl bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                  Openings Section Title
                </Label>
                <Input
                  value={listingsHeading}
                  onChange={(e) => setListingsHeading(e.target.value)}
                  placeholder="Current Openings"
                  className="h-10 text-sm font-semibold rounded-xl bg-gray-50/50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Tagline / Overview Statement
              </Label>
              <textarea
                value={headerContent}
                onChange={(e) => setHeaderContent(e.target.value)}
                rows={2}
                placeholder="Join our dedicated team..."
                className="w-full p-3 text-xs rounded-xl bg-gray-50/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Section 2: Active Job Vacancies List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Active Vacancies & Job Descriptions ({jobs.length})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Link PDF documents, Google Sheet application forms, or external job portals.
                </p>
              </div>

              <Button
                size="sm"
                onClick={addJob}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs shadow-xs"
              >
                <Plus size={15} /> Add Position
              </Button>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-white/[0.02] border border-dashed border-gray-300 dark:border-white/10 rounded-2xl">
                <Briefcase size={36} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  No Job Openings Configured
                </h4>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Click below to post your first position opening.
                </p>
                <Button size="sm" onClick={addJob} className="bg-indigo-600 text-white text-xs">
                  <Plus size={14} className="mr-1" /> Add Position
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, idx) => (
                  <div
                    key={job.id || idx}
                    className={`p-6 rounded-2xl border transition-all duration-200 ${
                      job.enabled !== false
                        ? "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500/30"
                        : "bg-gray-100/60 dark:bg-white/[0.01] border-dashed border-gray-300 dark:border-white/5 opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        {/* Position Reorder */}
                        <div className="flex items-center gap-1 text-gray-400">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveJob(idx, "up")}
                            className="p-1 hover:text-gray-700 dark:hover:text-white disabled:opacity-20 rounded"
                            title="Move up"
                          >
                            <ArrowUp size={15} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === jobs.length - 1}
                            onClick={() => moveJob(idx, "down")}
                            className="p-1 hover:text-gray-700 dark:hover:text-white disabled:opacity-20 rounded"
                            title="Move down"
                          >
                            <ArrowDown size={15} />
                          </button>
                        </div>

                        <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>

                        <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                          {job.heading || "Untitled Position"}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateJob(idx, "enabled", job.enabled === false)}
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                            job.enabled !== false
                              ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              : "text-gray-400 hover:bg-gray-200/50"
                          }`}
                          title={job.enabled !== false ? "Visible (click to hide)" : "Hidden (click to show)"}
                        >
                          {job.enabled !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                          <span className="text-[11px] hidden sm:inline">
                            {job.enabled !== false ? "Active" : "Hidden"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeJob(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Delete Position"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      {/* Job Title */}
                      <div className="sm:col-span-1">
                        <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                          Job Title / Position
                        </Label>
                        <Input
                          value={job.heading}
                          onChange={(e) => updateJob(idx, "heading", e.target.value)}
                          placeholder="e.g. Project Manager"
                          className="h-9 text-xs font-semibold rounded-lg bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                          Location
                        </Label>
                        <Input
                          value={job.location}
                          onChange={(e) => updateJob(idx, "location", e.target.value)}
                          placeholder="e.g. Kitchener, ON, Canada"
                          className="h-9 text-xs rounded-lg bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
                        />
                      </div>

                      {/* Job Type */}
                      <div>
                        <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                          Employment Type
                        </Label>
                        <Input
                          value={job.jobType}
                          onChange={(e) => updateJob(idx, "jobType", e.target.value)}
                          placeholder="e.g. Full Time, 1-year contract"
                          className="h-9 text-xs rounded-lg bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
                        />
                      </div>
                    </div>

                    {/* Links Row */}
                    <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                      {/* PDF Document URL */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <FileText size={13} className="text-indigo-600" />
                            PDF Document Link (Job Description)
                          </Label>
                          {job.pdfUrl && (
                            <a
                              href={job.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> Test PDF
                            </a>
                          )}
                        </div>
                        <Input
                          value={job.pdfUrl || ""}
                          onChange={(e) => updateJob(idx, "pdfUrl", e.target.value)}
                          placeholder="https://.../job_description.pdf or /pdfs/..."
                          className="h-9 text-xs font-mono rounded-lg bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
                        />
                      </div>

                      {/* External Portal / Google Sheet / Form Link */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1">
                            <ExternalLink size={13} className="text-indigo-600" />
                            Application Portal / Form Link (Google Sheet, Form, etc.)
                          </Label>
                          {job.externalLink && (
                            <a
                              href={job.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> Test Portal
                            </a>
                          )}
                        </div>
                        <Input
                          value={job.externalLink || ""}
                          onChange={(e) => updateJob(idx, "externalLink", e.target.value)}
                          placeholder="https://forms.gle/... or https://docs.google.com/spreadsheets/..."
                          className="h-9 text-xs font-mono rounded-lg bg-white dark:bg-white/5 border-gray-200 dark:border-white/10"
                        />
                      </div>
                    </div>

                    {/* Optional Full-Text Job Description with Rich Text Controls */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                          <AlignLeft size={13} className="text-indigo-600" />
                          Job Description &amp; Responsibilities (Optional In-App Text)
                        </Label>
                        <span className="text-[10px] text-gray-400 font-medium italic">
                          Optional — shown when applicants click to view details on the careers page
                        </span>
                      </div>
                      <div className="rounded-xl border border-gray-200/80 dark:border-white/10 overflow-hidden bg-white/60 dark:bg-white/[0.02]">
                        <RichTextEditor
                          value={job.description || ""}
                          onChange={(html) => updateJob(idx, "description", html)}
                          placeholder="Provide the role summary, key qualifications, core responsibilities, and application directions..."
                          minHeight="140px"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
