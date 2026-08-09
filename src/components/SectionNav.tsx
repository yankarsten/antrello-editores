/**
 * Sticky jump bar for the sections of a project page. A video can accumulate
 * dozens of raw uploads, so "Entregas do editor" is one click away instead of
 * one long scroll. Sits right under the 68px app header.
 */
export interface SectionLink {
  id: string;
  label: string;
  count?: number;
}

export default function SectionNav({ sections }: { sections: SectionLink[] }) {
  return (
    <nav
      aria-label="Seções deste vídeo"
      className="sticky top-[68px] z-30 -mx-4 mt-6 flex flex-wrap gap-2 border-b border-ink/15 bg-white px-4 py-3 sm:-mx-6 sm:px-6"
    >
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="chip bg-white transition hover:bg-accent"
        >
          {section.label}
          {section.count !== undefined && <span className="font-normal text-ink/50">{section.count}</span>}
        </a>
      ))}
    </nav>
  );
}
