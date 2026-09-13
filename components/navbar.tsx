"use client";

import { Show, SignOutButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import Logo from "@/components/logo";
import ThemeToggle from "@/components/theme/theme-toggle";

const LINKS = [
  { href: "/dashboard", label: "Documents" },
  { href: "/pricing", label: "Pricing" },
];

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setOpen] = useState(false);

  // The auth screens are standalone cards in the design — no chrome above them.
  const isAuthRoute =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => setOpen((open) => !open), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  if (isAuthRoute) {
    return null;
  }

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav className="relative z-50 border-line border-b bg-surface dark:bg-paper">
      <div className="flex h-[60px] items-center justify-between px-5 md:h-[76px] md:px-8 lg:px-10">
        <Logo />

        {/* Desktop */}
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((link) => (
            <Link
              className={`t-ui transition-colors ${
                isActive(link.href)
                  ? "font-medium text-ink"
                  : "text-subtle hover:text-ink"
              }`}
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}

          <Show when="signed-in">
            <Link
              className={`t-ui transition-colors ${
                isActive("/account")
                  ? "font-medium text-ink"
                  : "text-subtle hover:text-ink"
              }`}
              href="/account"
            >
              Account
            </Link>
          </Show>

          <ThemeToggle />

          <Show when="signed-in">
            <SignOutButton>
              <button className="btn btn-quiet t-ui" type="button">
                Sign out
              </button>
            </SignOutButton>
          </Show>

          <Show when="signed-out">
            <Link
              className="btn btn-signal px-[18px] py-[9px] text-[14px]"
              href="/sign-in"
            >
              Sign in
            </Link>
          </Show>
        </div>

        {/* Mobile trigger — two rules, per the design; no icon set involved. */}
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          className="relative flex h-11 w-11 flex-col items-center justify-center gap-[5px] md:hidden"
          onClick={toggleMenu}
          type="button"
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
      {isOpen ? (
        <div className="fixed inset-x-0 top-[60px] bottom-0 z-40 overflow-y-auto bg-paper md:hidden">
          <div className="flex flex-col">
            {LINKS.map((link) => (
              <Link
                className="border-line border-b px-5 py-5 font-semibold text-[22px] tracking-[-0.02em]"
                href={link.href}
                key={link.href}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}

            <Show when="signed-in">
              <Link
                className="border-line border-b px-5 py-5 font-semibold text-[22px] tracking-[-0.02em]"
                href="/account"
                onClick={closeMenu}
              >
                Account
              </Link>
            </Show>

            <div className="flex items-center justify-between border-line border-b px-5 py-5">
              <span className="t-body text-subtle">Appearance</span>
              <ThemeToggle />
            </div>

            <div className="flex flex-col gap-2.5 px-5 py-6">
              <Show when="signed-in">
                <SignOutButton>
                  <button
                    className="btn btn-outline w-full py-4 text-[16px]"
                    type="button"
                  >
                    Sign out
                  </button>
                </SignOutButton>
              </Show>

              <Show when="signed-out">
                <Link
                  className="btn btn-signal w-full py-4 text-[16px]"
                  href="/sign-in"
                  onClick={closeMenu}
                >
                  Sign in
                </Link>
                <Link
                  className="btn btn-outline w-full py-4 text-[16px]"
                  href="/sign-up"
                  onClick={closeMenu}
                >
                  Create account
                </Link>
              </Show>
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
