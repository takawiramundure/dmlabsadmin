"use client";

import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "@/layout/AuthPageLayout";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPassword() {
  return (
    <>
      <PageMeta
        title="Reset Password | Digital Maples Labs CMS"
        description="Reset your password for Digital Maples Labs CMS Dashboard"
      />
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </>
  );
}
