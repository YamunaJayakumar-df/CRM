// FormErrorSummary: the box at the top of a form listing what went wrong.
//
// role="alert" makes screen readers announce it as soon as it appears after
// a failed save. Messages about one field link to that field (href="#id"),
// so keyboard users can jump straight to it. Nothing is shown when there
// are no errors.

export type FormErrorItem = {
  message: string;
  /** "#field-id" for a message about one field; leave out for general messages. */
  href?: string;
};

type FormErrorSummaryProps = {
  items: FormErrorItem[];
};

export default function FormErrorSummary({ items }: FormErrorSummaryProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div role="alert" className="mb-6 rounded-xl border border-danger px-4 py-3">
      <p className="text-sm font-medium text-ink">Please fix the following:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-danger">
        {items.map((item) => (
          <li key={item.message}>
            {item.href ? (
              <a href={item.href} className="underline underline-offset-2 hover:no-underline">
                {item.message}
              </a>
            ) : (
              item.message
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
