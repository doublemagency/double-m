"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicForm } from "./public-form";

export function AccountAwareHire() {
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard`, {
      credentials: "include",
    })
      .then(async (response) =>
        response.ok ? setRole((await response.json()).user?.role) : undefined,
      )
      .catch(() => {});
  }, []);
  if (role === "employer")
    return (
      <div className="account-request-callout">
        <h2>Your employer account is active</h2>
        <p>
          Submit this request inside your workspace so your details are filled
          automatically and every stage remains visible to you.
        </p>
        <Link className="button dark" href="/dashboard/requests">
          Continue in my workspace
        </Link>
      </div>
    );
  return <PublicForm kind="employer" />;
}
