"use client";

import { useState, useEffect } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PageMeta from "@/components/common/PageMeta";
import { FirestoreService } from "@/services/firestore";
import { useDialog } from "@/context/DialogContext";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDb } from "@/firebaseConfig";

export default function AuthorizedDomainsPage() {
  const { profile } = useAuth();
  const { confirm } = useDialog();
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSuperAdmin = profile?.role === "super_admin";

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    setLoading(true);
    setError("");
    try {
      const { getFunctions, httpsCallable } = await import("firebase/functions");
      const getAuthorizedDomains = httpsCallable(getFunctions(), "getAuthorizedDomains");
      const res = await getAuthorizedDomains();
      const fetchedDomains = (res.data as any).domains || [];
      setDomains(fetchedDomains);
    } catch (err: any) {
      console.error("Error fetching authorized domains:", err);
      setError(err.message || "Failed to load authorized domains.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain) return;

    const cleanedDomain = newDomain.trim().toLowerCase();
    
    if (cleanedDomain.includes(" ") || cleanedDomain.startsWith("http://") || cleanedDomain.startsWith("https://")) {
      setError("Please enter a raw domain name (e.g. bk.bweic.org) without http:// or https://");
      return;
    }

    if (domains.includes(cleanedDomain)) {
      setError("Domain already exists in list.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { getFunctions, httpsCallable } = await import("firebase/functions");
      const addAuthorizedDomain = httpsCallable(getFunctions(), "addAuthorizedDomain");
      const res = await addAuthorizedDomain({ domain: cleanedDomain });
      
      if ((res.data as any).success) {
        setDomains((res.data as any).domains || []);
        setNewDomain("");
        setSuccess(`Added ${cleanedDomain} successfully!`);
        
        // Log action
        const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("@/firebaseConfig");
        await addDoc(collection(db, 'audit_logs'), {
          timestamp: serverTimestamp(),
          userId: profile?.uid || "unknown",
          userEmail: profile?.email || "unknown",
          action: "authorized_domain_add",
          details: {
            domain: cleanedDomain
          },
          realRole: profile?.role || "unknown",
          activeRole: profile?.role || "unknown"
        });
      } else {
        throw new Error("Failed to add domain.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDomain = async (domainToDelete: string) => {
    const isConfirmed = await confirm({
      title: "Remove Authorized Domain",
      message: `Are you sure you want to remove ${domainToDelete} from the list?`,
      variant: "danger",
      confirmLabel: "Remove Domain"
    });

    if (!isConfirmed) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { getFunctions, httpsCallable } = await import("firebase/functions");
      const removeAuthorizedDomain = httpsCallable(getFunctions(), "removeAuthorizedDomain");
      const res = await removeAuthorizedDomain({ domain: domainToDelete });

      if ((res.data as any).success) {
        setDomains((res.data as any).domains || []);
        setSuccess(`Removed ${domainToDelete} successfully!`);

        // Log action
        const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("@/firebaseConfig");
        await addDoc(collection(db, 'audit_logs'), {
          timestamp: serverTimestamp(),
          userId: profile?.uid || "unknown",
          userEmail: profile?.email || "unknown",
          action: "authorized_domain_remove",
          details: {
            domain: domainToDelete
          },
          realRole: profile?.role || "unknown",
          activeRole: profile?.role || "unknown"
        });
      } else {
        throw new Error("Failed to delete domain.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete domain.");
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Alert variant="error" title="Access Denied" message="Only Super Admins can manage Authorized Domains configuration." />
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-gray-800 dark:text-white">Loading Authorized Domains...</div>;
  }

  return (
    <>
      <PageMeta
        title="Authorized Domains | Digital Maples Labs CMS"
        description="Manage Authorized Domains configuration for Firebase Authentication"
      />
      <PageBreadcrumb pageTitle="Authorized Domains Manager" />

      <div className="mx-auto max-w-270 space-y-6">
        {/* Instructions Alert */}
        <div className="rounded-sm border border-stroke bg-blue-50/50 p-6 shadow-default dark:border-strokedark dark:bg-boxdark/50">
          <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
            🌐 Live Firebase Auth Domain Whitelisting
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            This manager fetches and updates authorized domains directly from your Firebase project config in real-time. Adding or deleting a domain here updates your Firebase Authentication settings instantly.
          </p>
        </div>

        {error && <Alert variant="error" title="Error" message={error} />}
        {success && <Alert variant="success" title="Success" message={success} />}

        {/* Add New Domain Form */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              Add New Domain
            </h3>
          </div>
          <div className="p-7">
            <form onSubmit={handleAddDomain} className="flex gap-4">
              <div className="flex-1">
                <input
                  className="w-full rounded border border-stroke bg-gray py-3 px-4.5 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                  type="text"
                  placeholder="e.g. bk.niagarasuicidepreventioncoalition.ca"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  disabled={saving}
                />
              </div>
              <Button type="submit" disabled={saving || !newDomain.trim()}>
                {saving ? "Adding..." : "Add Domain"}
              </Button>
            </form>
          </div>
        </div>

        {/* Authorized Domains List */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke py-4 px-7 dark:border-strokedark">
            <h3 className="font-medium text-black dark:text-white">
              Active Authorized Domains List
            </h3>
          </div>
          <div className="p-7">
            <div className="divide-y divide-stroke dark:divide-strokedark">
              {domains.map((domain) => (
                <div key={domain} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-medium text-black dark:text-white">{domain}</span>
                    <span className="text-xs text-gray-500">
                      {domain.startsWith("localhost") ? "Local Development" : "Production Subdomain"}
                    </span>
                  </div>
                  {domain !== "localhost" && domain !== "nspc-web.firebaseapp.com" && (
                    <button
                      onClick={() => handleDeleteDomain(domain)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium"
                      disabled={saving}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
