import React from 'react';

// Source: Sefaria's own license map (static/js/sefaria/sefaria.js) — these are the
// exact deed versions Sefaria links to for each license code.
const LICENSE_DEEDS = {
  'cc-by-sa': { label: 'CC BY-SA 3.0', url: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  'cc-by': { label: 'CC BY 3.0', url: 'https://creativecommons.org/licenses/by/3.0/' },
};

function deedFor(license) {
  if (!license || typeof license !== 'string') return null;
  return LICENSE_DEEDS[license.trim().toLowerCase()] || null;
}

function sefariaUrl(ref) {
  return ref ? `https://www.sefaria.org/${encodeURIComponent(ref)}` : 'https://www.sefaria.org';
}

function VersionCredit({ version, sefariaRef, modificationNote }) {
  const deed = deedFor(version.license);

  if (!deed) {
    return <>{version.title} ({version.license})</>;
  }

  return (
    <>
      {version.title} —{' '}
      <a href={deed.url} target="_blank" rel="noopener noreferrer" className="underline">
        {deed.label}
      </a>
      . <a href={sefariaUrl(sefariaRef)} target="_blank" rel="noopener noreferrer" className="underline">
        Source: Sefaria
      </a>
      . {modificationNote || 'Text shown unmodified.'}
    </>
  );
}

export default function SefariaAttribution({ hebrew, english, sefariaRef, className = '', modificationNote }) {
  const versions = [hebrew, english].filter((version) => version?.license);
  if (!versions.length) return null;

  const hasCcVersion = versions.some((version) => deedFor(version.license));

  return (
    <p className={`px-1 pb-2 text-[11px] font-semibold leading-snug text-slate-400 ${className}`}>
      {versions.map((version, index) => (
        <React.Fragment key={version.title}>
          {index > 0 && ' · '}
          <VersionCredit version={version} sefariaRef={sefariaRef} modificationNote={modificationNote} />
        </React.Fragment>
      ))}
      {!hasCcVersion && (
        <>
          {' · '}
          <a href={sefariaUrl(sefariaRef)} target="_blank" rel="noopener noreferrer" className="underline">
            Source: Sefaria
          </a>
          .
        </>
      )}
    </p>
  );
}
