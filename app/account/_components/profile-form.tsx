"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";

const WHITESPACE_PATTERN = /\s+/;

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
    if (!(user && isDirty)) {
      return;
    }

    setStatus("saving");
    setError("");

    const [firstName, ...rest] = value.trim().split(WHITESPACE_PATTERN);

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

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
    setStatus("idle");
  };

  const handleCancel = () => {
    setName(null);
    setStatus("idle");
  };

  return (
    <form
      className="flex flex-col gap-5 border border-line bg-surface px-5 py-6 md:gap-5.5 md:p-8"
      onSubmit={handleSubmit}
    >
      <h2 className="t-card">Profile</h2>

      <div className="grid grid-cols-1 gap-4.5 md:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-meta">Name</span>
          <input
            className="border border-line-strong bg-surface px-3.5 py-3 text-[16px] md:text-[15px]"
            disabled={!isLoaded}
            onChange={handleNameChange}
            type="text"
            value={value}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="t-label-sm text-meta">Email</span>
          <input
            className="border border-line-strong bg-surface px-3.5 py-3 text-[16px] text-subtle md:text-[15px]"
            readOnly
            type="email"
            value={user?.primaryEmailAddress?.emailAddress ?? ""}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          className="btn btn-ink px-5.5 py-3 text-[15px] md:text-[14px]"
          disabled={!isDirty || status === "saving"}
          type="submit"
        >
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        <button
          className="btn btn-outline px-5.5 py-3 text-[15px] md:text-[14px]"
          disabled={!isDirty || status === "saving"}
          onClick={handleCancel}
          type="button"
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
