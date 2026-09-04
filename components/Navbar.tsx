"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Show, SignOutButton } from "@clerk/nextjs";

import Logo from "@/components/Logo";
import ThemeToggle from "@/components/theme/ThemeToggle";

const LINKS = [
  { href: "/dashboard", label: "Documents" },
  { href: "/pricing", label: "Pricing" },
];

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setOpen] = useState(false);

  // The auth screens are standalone cards in the design — no chrome above them.
  const isAuthRoute =
    pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (isAuthRoute) return null;

  const isActive = (href: string) => pathname?.startsWith(href);

  return (
    <nav className="relative z-50 border-b border-line bg-surface dark:bg-paper">
      <div className="flex h-[60px] items-center justify-between px-5 md:h-[76px] md:px-8 lg:px-10">
        <Logo />

        {/* Desktop */}
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`t-ui transition-colors ${
                isActive(link.href)
                  ? "font-medium text-ink"
                  : "text-subtle hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <Show when="signed-in">
            <Link
              href="/account"
              className={`t-ui transition-colors ${
                isActive("/account")
                  ? "font-medium text-ink"
                  : "text-subtle hover:text-ink"
              }`}
            >
              Account
            </Link>
          </Show>

          <ThemeToggle />

          <Show when="signed-in">
            <SignOutButton>
              <button type="button" className="btn btn-quiet t-ui">
                Sign out
              </button>
            </SignOutButton>
          </Show>

          <Show when="signed-out">
            <Link href="/sign-in" className="btn btn-signal px-[18px] py-[9px] text-[14px]">
              Sign in
            </Link>
          </Show>
        </div>

        {/* Mobile trigger — two rules, per the design; no icon set involved. */}
        <button
          type="button"
          onClick={() => setOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="relative flex h-11 w-11 flex-col items-center justify-center gap-[5px] md:hidden"
        >
          <span
            className={`h-[1.5px] w-5 bg-ink transition-transform duration-150 ${
              isOpen ? "translate-y-[3.25px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-[1.5px] w-5 bg-ink transition-transform duration-150 ${
              isOpen ? "-translate-y-[3.25px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu — full-screen list */}
      {isOpen && (
        <div className="fixed inset-x-0 top-[60px] bottom-0 z-40 overflow-y-auto bg-paper md:hidden">
          <div className="flex flex-col">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line px-5 py-5 text-[22px] font-semibold tracking-[-0.02em]"
              >
                {link.label}
              </Link>
            ))}

            <Show when="signed-in">
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="border-b border-line px-5 py-5 text-[22px] font-semibold tracking-[-0.02em]"
              >
                Account
              </Link>
            </Show>

            <div className="flex items-center justify-between border-b border-line px-5 py-5">
              <span className="t-body text-subtle">Appearance</span>
              <ThemeToggle />
            </div>

            <div className="flex flex-col gap-2.5 px-5 py-6">
              <Show when="signed-in">
                <SignOutButton>
                  <button
                    type="button"
                    className="btn btn-outline w-full py-4 text-[16px]"
                  >
                    Sign out
                  </button>
                </SignOutButton>
              </Show>

              <Show when="signed-out">
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="btn btn-signal w-full py-4 text-[16px]"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setOpen(false)}
                  className="btn btn-outline w-full py-4 text-[16px]"
                >
                  Create account
                </Link>
              </Show>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
