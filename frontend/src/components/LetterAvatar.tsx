// LetterAvatar: a round badge with the first letter of a company name,
// used instead of a logo. The tint is picked from a small fixed list
// based on the letter, so the same company always gets the same colour.
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

export default function LetterAvatar({ name }: LetterAvatarProps) {
  const trimmed = name.trim();
  const letter = trimmed === "" ? "?" : trimmed[0].toUpperCase();

  // The letter's character code always gives the same number,
  // so "Acme" and "Apex" both land on the same tint every time.
  const tint = tints[letter.charCodeAt(0) % tints.length];

  return (
    <span
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-medium ${tint}`}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
