"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

const joinName = (firstName?: string | null, lastName?: string | null) =>
  `${firstName || ""} ${lastName || ""}`.trim();

/**
 * Clerk owns the profile. The `user.updated` webhook mirrors the change into
 * the User table, so nothing is written to Prisma from here.
 *
 * Email is read-only: changing it in Clerk is a separate verification flow, not
 * a field edit, and the design renders it in muted text to say so.
 */
const ProfileForm = () => {
  const { user, isLoaded } = useUser();
  const [name, setName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const savedName = joinName(user?.firstName, user?.lastName);
  // `null` means untouched, so the field tracks Clerk until the user types.
  const value = name ?? savedName;
  const isDirty = value.trim() !== savedName;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !isDirty) return;

    setStatus("saving");
    setError("");

    const [firstName, ...rest] = value.trim().split(/\s+/);

    try {
      await user.update({
        firstName: firstName || "",
        lastName: rest.join(" "),
      });
      setName(null);
      setStatus("saved");
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof Error ? caught.message : "Could not save changes."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 border border-line bg-surface px-5 py-6 md:gap-5.5 md:p-8"
    >
      <h2 className="t-card">Profile</h2>

      <div className="grid grid-cols-1 gap-4.5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-meta">Name</span>
          <input
            type="text"
            value={value}
            disabled={!isLoaded}
            onChange={(event) => {
              setName(event.target.value);
              setStatus("idle");
            }}
            className="border border-line-strong bg-surface px-3.5 py-3 text-[16px] md:text-[15px]"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-meta">Email</span>
          <input
            type="email"
            readOnly
            value={user?.primaryEmailAddress?.emailAddress ?? ""}
            className="border border-line-strong bg-surface px-3.5 py-3 text-[16px] text-subtle md:text-[15px]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="submit"
          disabled={!isDirty || status === "saving"}
          className="btn btn-ink px-5.5 py-3 text-[15px] md:text-[14px]"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          disabled={!isDirty || status === "saving"}
          onClick={() => {
            setName(null);
            setStatus("idle");
          }}
          className="btn btn-outline px-5.5 py-3 text-[15px] md:text-[14px]"
        >
          Cancel
        </button>

        {status === "saved" && (
          <span className="t-small text-signal-fg">Saved.</span>
        )}
        {status === "error" && (
          <span className="t-small text-danger-fg">{error}</span>
        )}
      </div>
    </form>
  );
};

export default ProfileForm;
