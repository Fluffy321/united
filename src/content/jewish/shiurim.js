export const CURATED_SHIURIM = {
  featured: {
    title: 'Weekly Parsha Message',
    speaker: 'Rabbi Moshe Hauer',
    source: 'OU Torah',
    mediaType: 'Audio / video series',
    description: 'A steady, short-form parsha series from the Orthodox Union. Open the original OU Torah page for the current week.',
    href: 'https://outorah.org/series/4154/',
    terms: 'Linked to original OU Torah page; media is not copied or rehosted.',
  },
  collection: [
    {
      title: 'Parsha from OU',
      speaker: 'Orthodox Union speakers',
      source: 'OU Torah',
      mediaType: 'Audio / video library',
      description: 'A broad Orthodox parsha library with curated series from OU Torah.',
      href: 'https://outorah.org/series/3111/',
      terms: 'Linked to original OU Torah page; media is not copied or rehosted.',
    },
    {
      title: 'YUTorah',
      speaker: 'Yeshiva University / RIETS rabbeim and speakers',
      source: 'YUTorah',
      mediaType: 'Audio / video library',
      description: 'YUTorah’s official Torah media library, with timely parsha and daily-learning modules.',
      href: 'https://cf.yutorah.org/',
      terms: 'Linked to original YUTorah page; media is not copied or rehosted.',
    },
    {
      title: 'TorahAnytime Parsha',
      speaker: 'TorahAnytime speakers',
      source: 'TorahAnytime',
      mediaType: 'Audio / video library',
      description: 'Free TorahAnytime shiurim, opened on TorahAnytime for listening or watching.',
      href: 'https://www.torahanytime.com/#/browse?l=Parsha',
      terms: 'Linked to original TorahAnytime page; media is not copied or rehosted.',
    },
  ],
};

export function parshaSearchLinks(parshaTitle) {
  const cleanTitle = parshaTitle?.replace(/^Parashat\s+/i, '').trim();
  if (!cleanTitle) return [];
  const query = encodeURIComponent(cleanTitle);
  return [
    {
      title: `${cleanTitle} on OU Torah`,
      source: 'OU Torah',
      href: `https://outorah.org/search/?q=${query}`,
    },
  ];
}
