/**
 * Clerk ships its own card chrome, which does not match the flat, square,
 * hairline-bordered forms in the design. Every element it renders is remapped
 * onto the Digest tokens here.
 *
 * The `!` modifiers are load-bearing: Clerk's own stylesheet is more specific
 * than a plain utility class, so anything it sets itself (radius, shadow,
 * colour, type) has to be overridden rather than merely declared.
 */
export const clerkAppearance = {
  elements: {
    alert: "rounded-none! border! border-line-strong! bg-surface-2! text-ink!",
    alertText: "text-[14px]!",
    card: "w-full! rounded-none! border-0! shadow-none! bg-surface! px-9! py-9! gap-5!",
    cardBox:
      "w-full! rounded-none! border! border-line! shadow-none! bg-surface!",

    dividerLine: "bg-line!",
    dividerText:
      "font-mono! text-[10px]! uppercase! tracking-[0.08em]! text-meta!",

    footer: "bg-transparent! border-0! rounded-none!",
    footerAction: "bg-transparent!",
    footerActionLink:
      "text-[14px]! font-medium! text-ink! no-underline! border-b! border-line-strong!",
    footerActionText: "text-[14px]! text-subtle!",

    formButtonPrimary:
      "rounded-none! bg-signal! text-on-signal! shadow-none! border-0! text-[15px]! font-semibold! normal-case! tracking-normal! py-3.5! after:hidden! hover:bg-signal!",
    formFieldAction: "text-[14px]! text-subtle! hover:text-ink!",
    formFieldErrorText: "text-[14px]! text-danger-fg!",
    formFieldInput:
      "rounded-none! border! border-line-strong! bg-surface! text-ink! shadow-none! px-3.5! py-3! text-[16px]! md:text-[15px]! placeholder:text-meta!",
    formFieldInputShowPasswordButton: "text-meta! hover:text-ink!",

    formFieldLabel:
      "font-mono! text-[10px]! font-normal! uppercase! tracking-[0.08em]! text-meta!",
    formResendCodeLink: "text-[14px]! text-subtle! hover:text-ink!",

    header: "gap-1.5!",
    headerSubtitle: "text-left! text-[15px]! leading-[1.4]! text-subtle!",
    headerTitle:
      "text-left! text-[26px]! leading-[1.15]! font-semibold! tracking-[-0.025em]! text-ink!",

    identityPreview: "rounded-none! border! border-line! bg-surface-2!",
    otpCodeFieldInput: "rounded-none! border! border-line-strong! text-ink!",
    rootBox: "w-full!",

    socialButtonsBlockButton:
      "rounded-none! border! border-line-strong! bg-surface! text-ink! shadow-none! py-3! text-[15px]! hover:bg-surface-2!",
    socialButtonsBlockButtonText: "text-ink! font-normal! text-[15px]!",
  },
  variables: {
    borderRadius: "0",
    fontFamily: "var(--font-instrument-sans), system-ui, sans-serif",
    fontSize: "15px",
  },
};

/**
 * Clerk's default headings interpolate the application name from the Clerk
 * dashboard ("Sign in to PDF AI Analyzer"). The design specifies the copy, so
 * it is set here rather than left to a dashboard setting.
 */
export const clerkLocalization = {
  signIn: {
    start: {
      subtitle: "Use the email on your subscription.",
      title: "Sign in",
    },
  },
  signUp: {
    start: {
      subtitle: "Free to sign up. Pay when you subscribe.",
      title: "Create an account",
    },
  },
};
