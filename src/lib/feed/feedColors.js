const AUTHOR_COLORS = ['#1B4FA8', '#2E7D52', '#8B3A8B', '#C45B12', '#1B7A8A', '#8B2030', '#7B6A00', '#0A6B5E'];

function hashColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xFFFFFF;
  return AUTHOR_COLORS[Math.abs(h) % AUTHOR_COLORS.length];
}

export function authorColor(str = '') {
  return hashColor(str);
}

export function communityColor(id = '') {
  return hashColor(id);
}
