"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebaseConfig";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Alert from "@/components/ui/alert/Alert";

function SignInFormContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("expired") === "true") {
      setError("Your temporary password has expired (valid for 12 hours). Please request a password reset link below.");
    }
  }, [searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      let friendlyMessage = "Failed to sign in. Please try again.";
      if (err.code) {
        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/invalid-login-credentials":
            friendlyMessage = "Incorrect email or password. Please try again.";
            break;
          case "auth/user-not-found":
            friendlyMessage = "No account found with this email address.";
            break;
          case "auth/wrong-password":
            friendlyMessage = "Incorrect password. Please try again.";
            break;
          case "auth/invalid-email":
            friendlyMessage = "Please enter a valid email address.";
            break;
          case "auth/user-disabled":
            friendlyMessage = "This admin account has been disabled.";
            break;
          case "auth/too-many-requests":
            friendlyMessage = "Too many failed login attempts. Please try again later or reset your password.";
            break;
          case "auth/operation-not-allowed":
            friendlyMessage = "Email/Password login is not enabled. Please contact support.";
            break;
          default:
            friendlyMessage = err.message || friendlyMessage;
        }
      } else {
        friendlyMessage = err.message || friendlyMessage;
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const continueUrl = window.location.origin + '/signin';
      
      const { getFunctions, httpsCallable } = await import("firebase/functions");
      const sendCustomReset = httpsCallable(getFunctions(), "sendCustomPasswordResetEmail");
      await sendCustomReset({ email, continueUrl });

      setMessage("A password reset email has been sent via Resend. Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        {/* Removed back link as this is the entry point */}
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Digital Maples Labs CMS Portal
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isForgotPassword
                ? "Enter your email to receive a password reset link."
                : "Enter your email and password to sign in!"}
            </p>
          </div>
          <div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
            </div>

            {isForgotPassword ? (
              <form onSubmit={handleResetPassword}>
                <div className="space-y-6">
                  {error && <Alert variant="error" title="Reset Failed" message={error} />}
                  {message && <Alert variant="success" title="Link Dispatched" message={message} />}
                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>{" "}
                    </Label>
                    <Input
                      placeholder="admin@nspc.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button className="w-full" size="sm" disabled={loading} type="submit">
                      {loading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError("");
                        setMessage("");
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignIn}>
                <div className="space-y-6">
                  {error && <Alert variant="error" title="Login Failed" message={error} />}
                  <div>
                    <Label>
                      Email <span className="text-error-500">*</span>{" "}
                    </Label>
                    <Input
                      placeholder="admin@nspc.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>
                      Password <span className="text-error-500">*</span>{" "}
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isChecked} onChange={setIsChecked} />
                      <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                        Keep me logged in
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div>
                    <Button className="w-full" size="sm" disabled={loading} type="submit">
                      {loading ? "Signing in..." : "Sign in"}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function SignInForm() {
  return (
    <Suspense fallback={<div>Loading Sign In Form...</div>}>
      <SignInFormContent />
    </Suspense>
  );
}
