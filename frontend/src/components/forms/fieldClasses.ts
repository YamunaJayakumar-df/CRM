// The look of every form control (text box, text area, drop-down), in one place.
//
// Why: inputs must share the same height, corners, colours and error style.
// 44px tall (h-11) so they are easy to tap. The focus ring comes from the
// global :focus-visible rule in globals.css. A field with an error gets a
// red border (the error TEXT below it carries the meaning, not the colour).

const baseClasses =
  "w-full rounded-xl border bg-card px-3 text-base text-ink placeholder:text-muted transition-colors duration-150";

/** Classes for an <input> or <select>. */
export function inputClasses(hasError: boolean): string {
  return `${baseClasses} h-11 ${hasError ? "border-danger" : "border-line"}`;
}

/** Classes for a <textarea> (grows with rows, not a fixed height). */
export function textAreaClasses(hasError: boolean): string {
  return `${baseClasses} py-2.5 leading-6 ${hasError ? "border-danger" : "border-line"}`;
}
