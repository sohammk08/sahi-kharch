// Supported languages for the multilingual layer. Sarvam language codes.
export const LANGUAGES = [
  { code: "en-IN", label: "English", short: "EN" },
  { code: "hi-IN", label: "Hindi", short: "HI" },
  { code: "mr-IN", label: "Marathi", short: "MR" },
  { code: "te-IN", label: "Telugu", short: "TE" },
  { code: "kn-IN", label: "Kannada", short: "KN" },
];

export const LANG_BY_CODE = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l]),
);
