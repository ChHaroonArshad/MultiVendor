export const MIN_DESCRIPTION_LENGTH = 20;

const REQUIREMENTS = [
  {
    key: "description",
    label: "Store description",
    hint: `Tell customers what you sell (at least ${MIN_DESCRIPTION_LENGTH} characters).`,
    isDone: (p) => (p?.description || "").trim().length >= MIN_DESCRIPTION_LENGTH,
  },
  {
    key: "category",
    label: "Main category",
    hint: "Choose the category you sell in most.",
    isDone: (p) => Boolean((p?.category || "").trim()),
  },
  {
    key: "logo",
    label: "Store logo",
    hint: "Upload a logo so customers recognise your store.",
    isDone: (p) => Boolean(p?.logo),
  },
];

// Works with a Mongoose document, a lean object, or null (no profile yet).
export function getStoreCompletion(profile) {
  const items = REQUIREMENTS.map(({ key, label, hint, isDone }) => ({ key, label, hint, done: isDone(profile) }));
  const done = items.filter((item) => item.done).length;
  return { complete: done === items.length, done, total: items.length, items };
}