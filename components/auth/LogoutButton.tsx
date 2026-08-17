"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth-actions";

function LogoutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="h-11 w-full border-[#CBD5E1] bg-white text-[#0F172A] hover:border-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#0F172A] sm:w-auto"
      disabled={pending}
      type="submit"
      variant="outline"
    >
      <LogOut aria-hidden="true" />
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <LogoutSubmitButton />
    </form>
  );
}
