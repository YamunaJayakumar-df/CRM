// LetterAvatar: a round badge with a company's initials (e.g. "AC" for
// "Acme Corp"), used instead of a logo. The tint is picked from a small
// fixed list based on the whole name, so the same company always gets the
// same colour, and companies starting with the same letter usually differ.
import { initialsOf } from "@/lib/format/initials";

type LetterAvatarProps = {
  name: string;
};

// Full class names are written out so Tailwind can find them in this file.
const tints = [
  "bg-avatar-blue text-avatar-blue-ink",
  "bg-avatar-teal text-avatar-teal-ink",
  "bg-avatar-violet text-avatar-violet-ink",
  "bg-avatar-rose text-avatar-rose-ink",
  "bg-avatar-green text-avatar-green-ink",
];

/** Adds up the character codes of the name: same name -> same number, every time. */
function nameNumber(name: string): number {
  let total = 0;
  for (const character of name.trim().toLowerCase()) {
    total += character.codePointAt(0) ?? 0;
  }
  return total;
}

export default function LetterAvatar({ name }: LetterAvatarProps) {
  const tint = tints[nameNumber(name) % tints.length];

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium ${tint}`}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
