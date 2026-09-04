import Link from "next/link";

const NotFound = () => (
  <div className="px-5 py-8 md:px-10 md:py-12">
    <div className="mx-auto flex max-w-[404px] flex-col gap-3.5 border border-line px-5 py-7 md:p-9">
      <div className="t-label text-meta">404</div>
      <h1 className="t-auth">This page does not exist</h1>
      <p className="t-ui leading-[1.6] text-subtle">
        The link may be old or mistyped.
      </p>
      <Link
        href="/dashboard"
        className="btn btn-ink mt-1 self-start px-5.5 py-3 text-[15px] md:text-[14px]"
      >
        Go to documents
      </Link>
    </div>
  </div>
);

export default NotFound;
