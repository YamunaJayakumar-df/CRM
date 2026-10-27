// CustomerContactLines: the customer card's contact details, one line each
// with a small icon: contact person, phone, email and website.
//
// - Only filled-in details are shown, so the card stays short.
// - Phone and email are links that open the phone or mail app (tel:, mailto:).
// - The website is only a link when toSafeWebsiteUrl says it is a real
//   http/https address, so odd text in the field can never run code. It opens
//   in a new tab; rel="noopener noreferrer" stops that site controlling ours.
import { Globe, Mail, Phone, UserRound } from "lucide-react";
import type { Customer } from "@/lib/api/types";
import { mailtoHref } from "@/lib/format/mailtoHref";
import { displayWebsite, toSafeWebsiteUrl } from "@/lib/format/safeWebsiteUrl";
import { telHref } from "@/lib/format/telHref";

type CustomerContactLinesProps = {
  customer: Customer;
};

const iconProps = { size: 16, strokeWidth: 1.75, "aria-hidden": true } as const;
const linkClasses = "truncate text-accent hover:underline";

export default function CustomerContactLines({ customer }: CustomerContactLinesProps) {
  const contactName = (customer.contactName ?? "").trim();
  const phone = (customer.phone ?? "").trim();
  const email = (customer.email ?? "").trim();
  const phoneHref = telHref(customer.phone);
  const emailHref = mailtoHref(customer.email);
  const websiteText = displayWebsite(customer.website);
  const websiteUrl = toSafeWebsiteUrl(customer.website);

  const hasAnyDetail = contactName !== "" || phone !== "" || email !== "" || websiteText !== "";
  if (!hasAnyDetail) {
    return <p className="text-sm text-muted">No contact details yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5 text-sm text-ink">
      {contactName !== "" && (
        <ContactLine icon={<UserRound {...iconProps} />} label="Contact">
          <span className="truncate">{contactName}</span>
        </ContactLine>
      )}
      {phone !== "" && (
        <ContactLine icon={<Phone {...iconProps} />} label="Phone">
          {phoneHref !== null ? (
            <a href={phoneHref} className={linkClasses}>{phone}</a>
          ) : (
            <span className="truncate">{phone}</span>
          )}
        </ContactLine>
      )}
      {email !== "" && (
        <ContactLine icon={<Mail {...iconProps} />} label="Email">
          {emailHref !== null ? (
            <a href={emailHref} className={linkClasses}>{email}</a>
          ) : (
            <span className="truncate">{email}</span>
          )}
        </ContactLine>
      )}
      {websiteText !== "" && (
        <ContactLine icon={<Globe {...iconProps} />} label="Website">
          {websiteUrl !== null ? (
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className={linkClasses}>
              {websiteText}
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          ) : (
            <span className="truncate">{websiteText}</span>
          )}
        </ContactLine>
      )}
    </ul>
  );
}

type ContactLineProps = {
  icon: React.ReactNode;
  /** Read out by screen readers before the value (the icon alone is not enough). */
  label: string;
  children: React.ReactNode;
};

/** One icon + value line. Kept in this file because only CustomerContactLines uses it. */
function ContactLine({ icon, label, children }: ContactLineProps) {
  return (
    <li className="flex min-w-0 items-center gap-3">
      <span className="shrink-0 text-icon">{icon}</span>
      <span className="sr-only">{label}:</span>
      {children}
    </li>
  );
}
