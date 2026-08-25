"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { db } from "@/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function MFAEnrollPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError("Please enter a valid phone number with country code (e.g., +1234567890).");
      return;
    }

    if (!user || !profile) {
      setError("User profile not found.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Update user profile in Firestore
      const userRef = doc(db, "users", profile.uid);
      await updateDoc(userRef, { phoneNumber });

      // 2. Call Cloud Function to send SMS
      const functions = getFunctions();
      const sendMfaSms = httpsCallable(functions, "sendMfaSms");
      await sendMfaSms({ phoneNumber });

      // 3. Redirect to verify page
      // Force reload auth state might be needed, but profile is already updated in Firestore.
      // AuthContext listener doesn't automatically pull updates from Firestore unless we reload the page or trigger a fetch.
      // To keep it simple, we just redirect.
      window.location.href = "/mfa-verify";
    } catch (err: any) {
      setError(err.message || "Failed to enroll phone number.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Secure Your Account
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please provide a phone number for Multi-Factor Authentication. We will send a verification code via SMS.
            </p>
          </div>
          <form onSubmit={handleEnroll}>
            <div className="space-y-6">
              {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
              <div>
                <Label>
                  Phone Number (with Country Code) <span className="text-error-500">*</span>{" "}
                </Label>
                <Input
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <Button className="w-full" size="sm" disabled={loading} type="submit">
                  {loading ? "Sending Code..." : "Enroll Phone Number"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
