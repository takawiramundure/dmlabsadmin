"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { db, getDb } from "@/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { SITES } from "@/config/sites";
import Alert from "@/components/ui/alert/Alert";
import AuthLayout from "@/layout/AuthPageLayout";

export default function MFAEnrollPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const existingPhone = profile?.phoneNumber || (profile as any)?.phone || "";
    if (existingPhone) {
      setPhoneNumber(existingPhone);
    }
  }, [profile]);

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedPhone = phoneNumber.trim();
    if (!formattedPhone || !formattedPhone.startsWith("+")) {
      setError("Please enter a valid phone number with country code (e.g., +1234567890).");
      return;
    }

    if (!user || !profile) {
      setError("User profile not found. Please log in again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const phonePayload = {
        phoneNumber: formattedPhone,
        phone: formattedPhone
      };

      // 1. Update user profile in Firestore (central default db)
      const userRef = doc(db, "users", profile.uid);
      await setDoc(userRef, phonePayload, { merge: true });

      // If super_admin, also sync across all tenant databases
      if (profile.role === "super_admin") {
        await Promise.all(
          SITES.map(async (site) => {
            try {
              const siteDb = getDb(site.id);
              await setDoc(doc(siteDb, "users", profile.uid), phonePayload, { merge: true });
            } catch (syncErr) {
              console.warn(`Could not sync phone to site database '${site.id}':`, syncErr);
            }
          })
        );
      }

      // 2. Call Cloud Function to send SMS
      const functions = getFunctions();
      const sendMfaSms = httpsCallable(functions, "sendMfaSms");
      await sendMfaSms({ phoneNumber: formattedPhone });

      // 3. Redirect to verify page
      window.location.href = "/mfa-verify";
    } catch (err: any) {
      console.error("Enrollment failed:", err);
      setError(err.message || "Failed to enroll phone number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="w-full bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-default p-8 space-y-8 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
          <div>
            <div className="mb-6 text-center">
              <h1 className="mb-2 font-bold text-title-md text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MFA Phone Enrollment
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please provide your mobile phone number with country code. A 6-digit verification code will be sent to complete your login.
              </p>
            </div>

            <form onSubmit={handleEnroll} className="space-y-6">
              {error && <Alert variant="error" title="Enrollment Error" message={error} />}

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Mobile Phone Number <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400">Include country code (e.g. +1 for US/Canada, +44 for UK).</p>
              </div>

              <div className="flex flex-col gap-3 pt-2 text-center">
                <Button className="w-full h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all" disabled={loading} type="submit">
                  {loading ? "Sending Verification Code..." : "Enroll & Send Code"}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const { signOut } = await import("firebase/auth");
                      const { auth } = await import("@/firebaseConfig");
                      await signOut(auth);
                      router.replace("/signin");
                    }}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
