"use client";

import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "@/layout/AuthPageLayout";
import SignInForm from "@/components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Digital Maples Labs CMS Dashboard"
        description="Digital Maples Labs CMS Dashboard"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
