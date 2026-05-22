"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DepensesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/list/paiements"); }, [router]);
  return null;
}
