"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to signin page with signup mode
    router.replace("/auth/signin?mode=signup");
  }, [router]);
  
  return null;
}