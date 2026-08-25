"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "@/layout/AuthPageLayout";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { updatePassword } from "firebase/auth";
import { auth, getDb } from "@/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { SITES } from "@/config/sites";

export default function ChangePasswordPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No active user session found. Please log in.");
      }

      // 1. Update password in Firebase Auth
      await updatePassword(currentUser, password);

      // 2. Clear temp password flags in Firestore across all databases
      await Promise.all(
        SITES.map(async (site) => {
          try {
            const siteDb = getDb(site.id);
            await setDoc(
              doc(siteDb, "users", currentUser.uid),
              {
                tempPasswordActive: false,
                tempPasswordExpiresAt: null,
              },
              { merge: true }
            );
          } catch (err) {
            console.warn(`Could not sync updated temp password status to database '${site.id}':`, err);
          }
        })
      );

      // 3. Log the password update to audit logs
      try {
        const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("@/firebaseConfig");
        await addDoc(collection(db, 'audit_logs'), {
          timestamp: serverTimestamp(),
          userId: currentUser.uid,
          userEmail: currentUser.email || "unknown",
          action: "user_password_update",
          details: {
            method: "temp_password_reset"
          },
          realRole: profile?.role || "user",
          activeRole: profile?.role || "user"
        });
      } catch (logErr) {
        console.warn("Failed to log password update", logErr);
      }

      setSuccess(true);
      setTimeout(() => {
        // Redirect to dashboard home
        window.location.href = "/";
      }, 2500);
    } catch (err: any) {
      console.error("Failed to update password:", err);
      let msg = err.message || "Failed to update password.";
      if (err.code === "auth/requires-recent-login") {
        msg = "For security reasons, please log out and sign back in again before changing your password.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Update Password | Digital Maples Labs CMS"
        description="Set a new password for your account"
      />
      <AuthLayout>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="w-full bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-default p-8 space-y-6 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
            <div>
              <div className="mb-6 text-center">
                <h1 className="mb-2 font-bold text-title-md text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Update Password
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  You are currently logged in with a temporary password. Please choose a new secure password to continue.
                </p>
              </div>

              <div>
                {success ? (
                  <Alert
                    variant="success"
                    title="Password Updated"
                    message="Your password has been changed successfully. Loading dashboard..."
                  />
                ) : (
                  <form onSubmit={handleChangePassword}>
                    <div className="space-y-5">
                      {error && <Alert variant="error" title="Update Failed" message={error} />}

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          New Password <span className="text-error-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <span
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                          >
                            {showPassword ? (
                              <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                            ) : (
                              <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                          Confirm New Password <span className="text-error-500">*</span>
                        </Label>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-11 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="pt-2">
                        <Button
                          className="w-full h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                          disabled={loading}
                          type="submit"
                        >
                          {loading ? "Saving..." : "Save Password"}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
