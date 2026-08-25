"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/firebaseConfig";
import Alert from "@/components/ui/alert/Alert";

function ResetPasswordFormContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const [email, setEmail] = useState("");

  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const router = useRouter();

  useEffect(() => {
    if (!oobCode) {
      setError("No reset code provided. Please check your email link.");
      setVerifying(false);
      return;
    }

    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setValidCode(true);
      } catch (err: any) {
        setError("Invalid or expired reset code. Please request a new password reset.");
      } finally {
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !validCode) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await confirmPasswordReset(auth, oobCode, password);
      
      // Log password reset to audit logs
      try {
        const { getDb } = await import("@/firebaseConfig");
        const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        const db = getDb('(default)');
        await addDoc(collection(db, 'audit_logs'), {
          timestamp: serverTimestamp(),
          userId: email, // Since we might not have uid, we use email as a fallback ID
          userEmail: email,
          action: "user_password_reset",
          details: {
            method: "email_link_reset"
          },
          realRole: "user",
          activeRole: "user"
        });
      } catch (logErr) {
        console.warn("Failed to log password reset action", logErr);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-boxdark rounded-2xl border border-stroke dark:border-strokedark shadow-default p-8 space-y-6 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95">
        <div>
          <div className="mb-6 text-center">
            <h1 className="mb-2 font-bold text-title-md text-gray-900 dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Set New Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {verifying 
                ? "Verifying reset code..." 
                : validCode 
                  ? `Choose a secure password for ${email}` 
                  : "Unable to reset password"}
            </p>
          </div>

          <div>
            {success ? (
              <Alert variant="success" title="Success" message="Your password has been reset successfully. Redirecting to sign in..." />
            ) : verifying ? (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="inline-block animate-pulse">Verifying reset code request...</span>
              </div>
            ) : validCode ? (
              <form onSubmit={handleResetPassword}>
                <div className="space-y-6">
                  {error && <Alert variant="error" title="Reset Failed" message={error} />}
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      New Password <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
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
                  
                  <div className="pt-2">
                    <Button className="w-full h-11 text-sm font-semibold shadow-md hover:shadow-lg transition-all" disabled={loading} type="submit">
                      {loading ? "Resetting Password..." : "Update Password"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {error && <Alert variant="error" title="Expired Request" message={error} />}
                <Button className="w-full h-11 mt-4 text-sm font-semibold shadow-md hover:shadow-lg transition-all" onClick={() => router.push("/signin")}>
                  Return to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
