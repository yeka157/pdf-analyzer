"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

const RedirectComponent = ({ to }: { to: string }) => {
  const router = useRouter();
  useEffect(() => {
    router.push(to);
  }, [router, to]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5">
      <div className="flex w-full max-w-[380px] flex-col gap-4">
        <div className="progress-track" aria-hidden>
          <span />
        </div>
        <p className="t-small text-subtle">Looking for your subscription…</p>
      </div>
    </div>
  );
};

export default RedirectComponent;
