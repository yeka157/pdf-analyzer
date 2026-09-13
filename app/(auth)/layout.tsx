import { LogoMark } from "@/components/logo";

/**
 * The auth screens are standalone cards on paper, with the mark above the
 * Clerk form rather than any app chrome. Navbar hides itself on these routes.
 */
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-[404px] flex-col gap-5">
        <LogoMark />
        {children}
      </div>
    </div>
  );
}
