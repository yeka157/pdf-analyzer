import { CircleAlert, CircleCheck } from "lucide-react";

/**
 * Inline notice: a hairline card with a 2px accent edge. Replaces the
 * translucent rounded banners — separation here comes from borders, not fills.
 */
const Notice = ({
  tone,
  children,
}: {
  tone: "success" | "error";
  children: React.ReactNode;
}) => {
  const Icon = tone === "success" ? CircleCheck : CircleAlert;

  return (
    <div
      className={`flex items-center gap-2.5 border border-line bg-surface px-4.5 py-4 ${
        tone === "success"
          ? "border-l-2 border-l-signal"
          : "border-l-2 border-l-danger"
      }`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon
        aria-hidden
        className={`size-[17px] shrink-0 ${
          tone === "success" ? "text-signal" : "text-danger"
        }`}
        strokeWidth={2}
      />
      <span className="t-small">{children}</span>
    </div>
  );
};

export default Notice;
