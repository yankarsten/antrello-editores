import { Space_Grotesk } from "next/font/google";

/**
 * Recreation of the "Home" frame (330:762) from the Positivus Landing Page
 * Figma community file. Values below are taken from the Figma node data:
 * palette #191A23 / #B9FF66 / #F3F3F3, Space Grotesk 400+500, 45px card radius,
 * 14px control radius, 1440px frame with 100px gutters (1240px content).
 *
 * Self-contained on purpose: the font is loaded here and scoped to the wrapper,
 * so the app's Inter/zinc/indigo theme in globals.css is untouched.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-space-grotesk",
});

const DARK = "#191A23";
const LIME = "#B9FF66";
const GREY = "#F3F3F3";

const NAV_LINKS = ["About us", "Services", "Use Cases", "Pricing", "Blog"];

const SERVICES = [
  { title: ["Search engine", "optimization"], bg: GREY, pill: LIME, dark: false },
  { title: ["Pay-per-click", "advertising"], bg: LIME, pill: "#FFFFFF", dark: false },
  { title: ["Social Media", "Marketing"], bg: DARK, pill: "#FFFFFF", dark: true },
  { title: ["Email", "Marketing"], bg: GREY, pill: LIME, dark: false },
  { title: ["Content", "Creation"], bg: LIME, pill: "#FFFFFF", dark: false },
  { title: ["Analytics and", "Tracking"], bg: DARK, pill: LIME, dark: true },
];

const CASE_STUDIES = [
  "For a local restaurant, we implemented a targeted PPC campaign that resulted in a 50% increase in website traffic and a 25% increase in sales.",
  "For a B2B software company, we developed an SEO strategy that resulted in a first page ranking for key keywords and a 200% increase in organic traffic.",
  "For a national retail chain, we created a social media marketing campaign that increased followers by 25% and generated a 20% increase in online sales.",
];

const PROCESS = [
  {
    step: "01",
    title: "Consultation",
    body: "During the initial consultation, we will discuss your business goals and objectives, target audience, and current marketing efforts. This will allow us to understand your needs and tailor our services to best fit your requirements.",
  },
  { step: "02", title: "Research and Strategy Development", body: "" },
  { step: "03", title: "Implementation", body: "" },
  { step: "04", title: "Monitoring and Optimization", body: "" },
  { step: "05", title: "Reporting and Communication", body: "" },
  { step: "06", title: "Continual Improvement", body: "" },
];

const TEAM = [
  {
    name: "John Smith",
    role: "CEO and Founder",
    bio: "10+ years of experience in digital marketing. Expertise in SEO, PPC, and content strategy",
  },
  {
    name: "Jane Doe",
    role: "Director of Operations",
    bio: "7+ years of experience in project management and team leadership. Strong organizational and communication skills",
  },
  {
    name: "Michael Brown",
    role: "Senior SEO Specialist",
    bio: "5+ years of experience in SEO and content creation. Proficient in keyword research and on-page optimization",
  },
  {
    name: "Emily Johnson",
    role: "PPC Manager",
    bio: "3+ years of experience in paid search advertising. Skilled in campaign management and performance analysis",
  },
  {
    name: "Brian Williams",
    role: "Social Media Specialist",
    bio: "4+ years of experience in social media marketing. Proficient in creating and scheduling content, analyzing metrics, and building engagement",
  },
  {
    name: "Sarah Kim",
    role: "Content Creator",
    bio: "2+ years of experience in writing and editing\nSkilled in creating compelling, SEO-optimized content for various industries",
  },
];

const TESTIMONIAL =
  "“We have been working with Positivus for the past year and have seen a significant increase in website traffic and leads as a result of their efforts. The team is professional, responsive, and truly cares about the success of our business. We highly recommend Positivus to any company looking to grow their online presence.”";

/* ---------------------------------------------------------------- primitives */

function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 md:px-[100px] ${className}`}>{children}</div>;
}

function Button({
  children,
  variant = "dark",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "dark" | "outline";
  className?: string;
}) {
  const styles =
    variant === "dark"
      ? "bg-[#191A23] text-white hover:bg-black"
      : "border border-[#191A23] text-black hover:bg-[#191A23] hover:text-white";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-[14px] px-[35px] py-5 text-xl leading-7 transition ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

/** Lime highlight behind a run of heading text — the signature Positivus mark. */
function Pill({
  children,
  color = LIME,
  className = "",
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  return (
    <span className={`inline-block rounded-[7px] px-[7px] ${className}`} style={{ backgroundColor: color }}>
      {children}
    </span>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-10">
      <h2 className="shrink-0 text-[40px] font-medium leading-[51px]">
        <Pill>{title}</Pill>
      </h2>
      <p className="max-w-[580px] text-lg leading-[23px]">{subtitle}</p>
    </div>
  );
}

/** Black disc + lime arrow, followed by a label. Used on service and case cards. */
function LearnMore({ dark = false, iconless = false }: { dark?: boolean; iconless?: boolean }) {
  return (
    <a href="#" className="group inline-flex items-center gap-[15px]">
      {!iconless && (
        <span
          className="flex h-[41px] w-[41px] shrink-0 items-center justify-center rounded-full transition group-hover:scale-105"
          style={{ backgroundColor: dark ? "#FFFFFF" : DARK }}
        >
          <svg width="17" height="10" viewBox="0 0 17 10" fill="none" aria-hidden="true">
            <path
              d="M1 5h14M11 1l4 4-4 4"
              stroke={dark ? DARK : LIME}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
      <span className={`text-xl leading-7 ${dark ? "text-white" : "text-black"}`}>Learn more</span>
    </a>
  );
}

/* ------------------------------------------------------------------ sections */

function Navbar() {
  return (
    <Container>
      <nav className="flex h-[68px] items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/positivus/logo.svg" alt="Positivus" width={220} height={36} className="h-9 w-[220px]" />
        <div className="hidden items-center gap-10 lg:flex">
          {NAV_LINKS.map((link) => (
            <a key={link} href="#" className="text-xl leading-7 transition hover:opacity-60">
              {link}
            </a>
          ))}
          <Button variant="outline">Request a quote</Button>
        </div>
      </nav>
    </Container>
  );
}

function Hero() {
  return (
    <Container className="mt-[70px]">
      <div className="flex flex-col items-start justify-between gap-10 lg:flex-row">
        <div className="flex max-w-[531px] flex-col gap-[35px]">
          <h1 className="text-[60px] font-medium leading-[76.6px]">
            Navigating the digital landscape for success
          </h1>
          <p className="max-w-[498px] text-xl leading-7">
            Our digital marketing agency helps businesses grow and succeed online through a range of
            services including SEO, PPC, social media marketing, and content creation.
          </p>
          <Button className="self-start">Book a consultation</Button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/positivus/hero-illustration.svg"
          alt=""
          width={600}
          height={515}
          className="w-full max-w-[600px]"
        />
      </div>
    </Container>
  );
}

function ClientLogos() {
  return (
    <Container className="mt-[70px]">
      <div className="flex flex-wrap items-center justify-between gap-8">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={n}
            src={`/positivus/client-logo-${n}.svg`}
            alt=""
            height={48}
            className="h-12 opacity-100 grayscale"
          />
        ))}
      </div>
    </Container>
  );
}

function Services() {
  return (
    <Container className="mt-[140px]">
      <SectionHeading
        title="Services"
        subtitle="At our digital marketing agency, we offer a range of services to help businesses grow and succeed online. These services include:"
      />
      <div className="mt-20 grid gap-10 lg:grid-cols-2">
        {SERVICES.map((service, i) => (
          <article
            key={service.title.join(" ")}
            className="flex min-h-[310px] items-center justify-between gap-[77px] rounded-[45px] border border-[#191A23] p-[50px]"
            style={{ backgroundColor: service.bg }}
          >
            <div className="flex min-h-[210px] flex-col justify-between">
              <h3 className="text-[30px] font-medium leading-[38.3px]">
                {service.title.map((word) => (
                  <span key={word} className="block w-fit">
                    <Pill color={service.pill}>{word}</Pill>
                  </span>
                ))}
              </h3>
              <LearnMore dark={service.dark} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/positivus/service-${i + 1}.svg`}
              alt=""
              width={210}
              className="hidden w-[210px] shrink-0 sm:block"
            />
          </article>
        ))}
      </div>
    </Container>
  );
}

function CallToAction() {
  return (
    <Container className="mt-[100px]">
      <div className="relative flex items-center rounded-[45px] px-[60px] py-[60px]" style={{ backgroundColor: GREY }}>
        <div className="flex max-w-[500px] flex-col gap-[26px]">
          <h2 className="text-[30px] font-medium leading-[38.3px]">Let&rsquo;s make things happen</h2>
          <p className="text-lg leading-[23px]">
            Contact us today to learn more about how our digital marketing services can help your
            business grow and succeed online.
          </p>
          <Button className="self-start">Get your free proposal</Button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/positivus/cta-illustration.svg"
          alt=""
          className="pointer-events-none absolute right-[80px] hidden w-[359px] lg:block"
        />
      </div>
    </Container>
  );
}

function CaseStudies() {
  return (
    <Container className="mt-[140px]">
      <SectionHeading
        title="Case Studies"
        subtitle="Explore Real-Life Examples of Our Proven Digital Marketing Success through Our Case Studies"
      />
      <div
        className="mt-20 flex flex-col gap-16 rounded-[45px] px-[60px] py-[70px] lg:flex-row"
        style={{ backgroundColor: DARK }}
      >
        {CASE_STUDIES.map((study, i) => (
          <div key={study} className="flex flex-1 gap-16">
            <div className="flex flex-col gap-5">
              <p className="text-lg leading-[23px] text-white">{study}</p>
              <LearnMore dark iconless />
            </div>
            {i < CASE_STUDIES.length - 1 && (
              <div className="hidden w-px shrink-0 self-stretch bg-white lg:block" />
            )}
          </div>
        ))}
      </div>
    </Container>
  );
}

function PlusIcon({ open }: { open: boolean }) {
  return (
    <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border border-black bg-transparent">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <path d="M1 13h24" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        {!open && <path d="M13 1v24" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />}
      </svg>
    </span>
  );
}

function Process() {
  return (
    <Container className="mt-[140px]">
      <SectionHeading
        title="Our Working Process"
        subtitle="Step-by-Step Guide to Achieving Your Business Goals"
      />
      <div className="mt-20 flex flex-col gap-[30px]">
        {PROCESS.map((item) => {
          const open = Boolean(item.body);
          return (
            <div
              key={item.step}
              className="rounded-[45px] border border-[#191A23] px-[60px] py-[41px]"
              style={{ backgroundColor: open ? LIME : GREY }}
            >
              <div className="flex items-center justify-between gap-10">
                <div className="flex items-center gap-[25px]">
                  <span className="text-[60px] font-medium leading-[76.6px]">{item.step}</span>
                  <span className="text-[30px] font-medium leading-[38.3px]">{item.title}</span>
                </div>
                <PlusIcon open={open} />
              </div>
              {open && (
                <>
                  <div className="mt-[30px] h-px w-full bg-black" />
                  <p className="mt-[30px] text-lg leading-[23px]">{item.body}</p>
                </>
              )}
            </div>
          );
        })}
      </div>
    </Container>
  );
}

function Team() {
  return (
    <Container className="mt-[140px]">
      <SectionHeading
        title="Team"
        subtitle="Meet the skilled and experienced team behind our successful digital marketing strategies"
      />
      <div className="mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {TEAM.map((member, i) => (
          <article
            key={member.name}
            className="flex flex-col gap-7 rounded-[45px] border border-[#191A23] bg-white px-[35px] py-10"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-end gap-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/positivus/team-${i + 1}.png`} alt="" width={106} className="w-[106px]" />
                <div>
                  <p className="text-xl font-medium leading-[26px]">{member.name}</p>
                  <p className="text-lg leading-[23px]">{member.role}</p>
                </div>
              </div>
              <a href="#" aria-label={`${member.name} on LinkedIn`} className="shrink-0">
                <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                  <circle cx="17" cy="17" r="17" fill="#000" />
                  <path
                    d="M11.7 13.6h2.4v8.7h-2.4v-8.7Zm1.2-3.8a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Zm3.2 3.8h2.3v1.2h.03c.32-.6 1.1-1.24 2.27-1.24 2.43 0 2.88 1.6 2.88 3.68v4.24h-2.4v-3.76c0-.9-.02-2.05-1.25-2.05-1.25 0-1.44.98-1.44 1.99v3.82h-2.4v-8.7Z"
                    fill={LIME}
                  />
                </svg>
              </a>
            </div>
            <div className="h-px w-full bg-black" />
            <p className="whitespace-pre-line text-lg leading-[23px]">{member.bio}</p>
          </article>
        ))}
      </div>
      <div className="mt-10 flex justify-end">
        <Button>See all team</Button>
      </div>
    </Container>
  );
}

function Testimonials() {
  return (
    <Container className="mt-[100px]">
      <SectionHeading
        title="Testimonials"
        subtitle="Hear from Our Satisfied Clients: Read Our Testimonials to Learn More about Our Digital Marketing Services"
      />
      <div className="mt-20 rounded-[45px] px-[60px] py-[84px]" style={{ backgroundColor: DARK }}>
        <div className="flex flex-col items-center gap-[124px]">
          <div className="grid w-full gap-[50px] lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <figure key={i} className="flex flex-col gap-5">
                <blockquote className="relative rounded-[45px] border border-[#B9FF66] p-[52px] text-lg leading-[23px] text-white">
                  {TESTIMONIAL}
                  {/* speech-bubble tail */}
                  <span
                    className="absolute -bottom-[13px] left-[52px] h-[26px] w-[26px] rotate-45 border-b border-r"
                    style={{ borderColor: LIME, backgroundColor: DARK }}
                  />
                </blockquote>
                <figcaption className="pl-[52px] text-lg leading-[23px]">
                  <span className="block font-medium" style={{ color: LIME }}>
                    John Smith
                  </span>
                  <span className="block text-white">Marketing Director at XYZ Corp</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="flex items-center gap-[189px]">
            <button type="button" aria-label="Previous testimonial" className="text-white transition hover:opacity-60">
              <svg width="30" height="16" viewBox="0 0 30 16" fill="none">
                <path d="M29 8H1m7-7-7 7 7 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="flex items-center gap-5" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill={i === 2 ? LIME : "#fff"}>
                  <path d="M7 0c0 3.87 3.13 7 7 7-3.87 0-7 3.13-7 7 0-3.87-3.13-7-7-7 3.87 0 7-3.13 7-7Z" />
                </svg>
              ))}
            </div>
            <button type="button" aria-label="Next testimonial" className="text-white transition hover:opacity-60">
              <svg width="30" height="16" viewBox="0 0 30 16" fill="none">
                <path d="M1 8h28m-7-7 7 7-7 7" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Container>
  );
}

function ContactField({
  label,
  placeholder,
  textarea = false,
}: {
  label: string;
  placeholder: string;
  textarea?: boolean;
}) {
  const shared =
    "w-full rounded-[14px] border border-black bg-white px-[30px] py-[18px] text-lg leading-[23px] text-black placeholder-[#898989] outline-none transition focus:border-[#B9FF66] focus:ring-2 focus:ring-[#B9FF66]/40";
  return (
    <label className="flex flex-col gap-[5px]">
      <span className="text-lg leading-7">{label}</span>
      {textarea ? (
        <textarea placeholder={placeholder} rows={5} className={`${shared} resize-none`} />
      ) : (
        <input type="text" placeholder={placeholder} className={shared} />
      )}
    </label>
  );
}

function Contact() {
  return (
    <Container className="mt-[140px]">
      <SectionHeading
        title="Contact Us"
        subtitle="Connect with Us: Let's Discuss Your Digital Marketing Needs"
      />
      <div
        className="relative mt-20 overflow-hidden rounded-[45px] px-5 pb-20 pt-[60px] md:px-[100px]"
        style={{ backgroundColor: GREY }}
      >
        <form className="flex max-w-[556px] flex-col gap-10">
          <div className="flex items-center gap-[35px]">
            {["Say Hi", "Get a Quote"].map((option, i) => (
              <label key={option} className="flex items-center gap-3.5 text-lg leading-[23px]">
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-black bg-white">
                  {i === 0 && <span className="h-4 w-4 rounded-full" style={{ backgroundColor: LIME }} />}
                </span>
                <input type="radio" name="contact-type" defaultChecked={i === 0} className="sr-only" />
                {option}
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-[25px]">
            <ContactField label="Name" placeholder="Name" />
            <ContactField label="Email*" placeholder="Email" />
            <ContactField label="Message*" placeholder="Message" textarea />
          </div>
          <Button className="w-full">Send Message</Button>
        </form>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/positivus/contact-illustration.svg"
          alt=""
          className="pointer-events-none absolute -right-[100px] top-1/2 hidden w-[692px] -translate-y-1/2 lg:block"
        />
      </div>
    </Container>
  );
}

function Footer() {
  return (
    <Container className="mt-[140px]">
      <footer className="rounded-t-[45px] px-[60px] pb-[50px] pt-[55px]" style={{ backgroundColor: DARK }}>
        <div className="flex flex-col gap-[50px]">
          <div className="flex flex-col gap-[66px]">
            <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/positivus/logo-white.svg" alt="Positivus" width={180} className="w-[180px]" />
              <nav className="flex flex-wrap items-center justify-center gap-10">
                {NAV_LINKS.map((link) => (
                  <a key={link} href="#" className="text-lg leading-[23px] text-white underline transition hover:opacity-60">
                    {link}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-5">
                {["linkedin", "facebook", "twitter"].map((network) => (
                  <a key={network} href="#" aria-label={network} className="transition hover:opacity-70">
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                      <circle cx="15" cy="15" r="15" fill="#fff" />
                      <circle cx="15" cy="15" r="6" fill={DARK} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-10 lg:flex-row lg:gap-[154px]">
              <div className="flex flex-col gap-[27px]">
                <Pill className="text-xl leading-7 text-black">Contact us:</Pill>
                <address className="flex flex-col gap-5 not-italic text-lg leading-[23px] text-white">
                  <span>Email: info@positivus.com</span>
                  <span>Phone: 555-567-8901</span>
                  <span>
                    Address: 1234 Main St
                    <br />
                    Moonstone City, Stardust State 12345
                  </span>
                </address>
              </div>
              <form
                className="flex flex-col items-stretch gap-5 rounded-[14px] p-10 sm:flex-row sm:items-center"
                style={{ backgroundColor: "#292A32" }}
              >
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-[14px] border border-white bg-transparent px-[35px] py-[22px] text-lg leading-[23px] text-white placeholder-white outline-none transition focus:border-[#B9FF66] sm:w-[285px]"
                />
                <button
                  type="button"
                  className="rounded-[14px] px-[35px] py-[22px] text-xl leading-7 text-black transition hover:brightness-95"
                  style={{ backgroundColor: LIME }}
                >
                  Subscribe to news
                </button>
              </form>
            </div>
          </div>
          <div className="flex flex-col gap-[50px]">
            <div className="h-px w-full bg-white" />
            <div className="flex flex-wrap items-center gap-10 text-lg leading-7 text-white">
              <span>&copy; 2023 Positivus. All Rights Reserved.</span>
              <a href="#" className="underline transition hover:opacity-60">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </Container>
  );
}

/* ---------------------------------------------------------------------- page */

export default function PositivusLanding() {
  return (
    <div
      className={`${spaceGrotesk.variable} bg-white pt-[60px] text-black antialiased`}
      style={{ fontFamily: "var(--font-space-grotesk)" }}
    >
      <Navbar />
      <Hero />
      <ClientLogos />
      <Services />
      <CallToAction />
      <CaseStudies />
      <Process />
      <Team />
      <Testimonials />
      <Contact />
      <Footer />
    </div>
  );
}
