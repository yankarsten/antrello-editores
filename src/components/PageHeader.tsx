/**
 * Page title in the landing page's section-heading style: the title sits on an
 * accent highlight, with the supporting line beside or below it.
 */
export default function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-medium leading-tight">
          <span className="pill">{title}</span>
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Secondary heading used for the sections inside a page. */
export function SectionHeading({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <h2 className="text-xl font-medium text-ink">
      {children}
      {count !== undefined && <span className="ml-1.5 font-normal text-ink/50">({count})</span>}
    </h2>
  );
}
