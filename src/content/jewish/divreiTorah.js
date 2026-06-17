// Human-authored divrei Torah only. Add attributed pieces here after editorial review.
// Do not add AI-generated Torah content.
export const HUMAN_DIVREI_TORAH = [];

export function findHumanDvarTorah(reading) {
  if (!reading) return null;
  return HUMAN_DIVREI_TORAH.find((item) => {
    if (item.parshaTitle && item.parshaTitle === reading.title) return true;
    if (item.parshaDate && item.parshaDate === reading.date) return true;
    return false;
  }) || null;
}
