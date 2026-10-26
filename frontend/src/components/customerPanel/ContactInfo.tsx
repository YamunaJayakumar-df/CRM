// ContactInfo: the "Contact Information" block of the customer panel:
// contact name, phone, company, email, industry and notes, each with a
// small icon and a grey label. Empty fields show "—" so the layout stays
// the same for every customer. Two columns from `sm` up, one on phones.
// A <dl> (description list) is the HTML element for label/value pairs, so
// screen readers announce each label with its value.
import { Briefcase, Building2, Mail, Phone, StickyNote, UserRound } from "lucide-react";
import type { Customer } from "@/lib/api/types";
import PanelSection from "./PanelSection";

type ContactInfoProps = {
  customer: Customer;
};

const iconProps = { size: 14, strokeWidth: 1.75, "aria-hidden": true } as const;

/** Shows "—" for missing or blank values. */
function orDash(value: string | null): string {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? "—" : trimmed;
}

export default function ContactInfo({ customer }: ContactInfoProps) {
  return (
    <PanelSection title="Contact Information">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <ContactItem icon={<UserRound {...iconProps} />} label="Contact Name">
          {orDash(customer.contactName)}
        </ContactItem>
        <ContactItem icon={<Phone {...iconProps} />} label="Phone">
          {orDash(customer.phone)}
        </ContactItem>
        <ContactItem icon={<Building2 {...iconProps} />} label="Company">
          {orDash(customer.companyName)}
        </ContactItem>
        <ContactItem icon={<Mail {...iconProps} />} label="Email" breakAnywhere>
          {orDash(customer.email)}
        </ContactItem>
        <ContactItem icon={<Briefcase {...iconProps} />} label="Industry">
          {orDash(customer.industry)}
        </ContactItem>
        <ContactItem icon={<StickyNote {...iconProps} />} label="Notes" wide>
          {/* Up to 3 lines here; the Notes tab shows everything. */}
          <span className="line-clamp-3 whitespace-pre-line">{orDash(customer.notes)}</span>
        </ContactItem>
      </dl>
    </PanelSection>
  );
}

type ContactItemProps = {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  /** Take both columns (for longer text like notes). */
  wide?: boolean;
  /** Allow breaking inside a word (long email addresses have no spaces). */
  breakAnywhere?: boolean;
};

/** One label + value pair. Kept in this file because only ContactInfo uses it. */
function ContactItem({ icon, label, children, wide = false, breakAnywhere = false }: ContactItemProps) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="flex items-center gap-2 text-xs text-muted">
        <span className="text-icon">{icon}</span>
        {label}
      </dt>
      <dd className={`mt-1 text-sm text-ink ${breakAnywhere ? "break-all" : "break-words"}`}>
        {children}
      </dd>
    </div>
  );
}
