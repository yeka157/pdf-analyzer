"use client";

import { SignOutButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing" },
];

/**
 * The design shows every card stacked in one column with one nav item marked
 * active, so the nav scrolls rather than routes. Active state follows what is
 * actually on screen instead of the last thing clicked.
 */
const AccountNav = () => {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  useEffect(() => {
    const sections = SECTIONS.map((section) =>
      document.getElementById(section.id)
    ).filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-76px 0px -60% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Account sections">
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          aria-current={activeId === section.id}
          className={`border-l-2 px-3.5 py-2.5 text-[15px] transition-colors duration-150 ${
            activeId === section.id
              ? "border-l-signal bg-surface font-medium text-ink"
              : "border-l-transparent text-subtle hover:text-ink"
          }`}
        >
          {section.label}
        </a>
      ))}

      <SignOutButton>
        <button
          type="button"
          className="border-l-2 border-l-transparent px-3.5 py-2.5 text-left text-[15px] text-subtle transition-colors duration-150 hover:text-ink"
        >
          Sign out
        </button>
      </SignOutButton>
    </nav>
  );
};

export default AccountNav;
