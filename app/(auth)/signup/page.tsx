"use client";

import PageMeta from "@/components/common/PageMeta";
import AuthLayout from "@/layout/AuthPageLayout";
import SignUpForm from "@/components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Digital Maples Labs CMS Dashboard"
        description="Digital Maples Labs CMS Dashboard"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
