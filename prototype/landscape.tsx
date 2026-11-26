import React from 'react';

const count = (length: number) => Array.from({length}, (_, index) => index);
const phase = (time: number, offset: number, interval: number) => ((time + offset) % interval) / interval;

const stages = {
  cycle: {label: 'Ocean → sky → land', x: 420, y: 78, fill: '#e0fbff'},
  evaporation: {label: 'Liquid → vapour', x: 200, y: 450, fill: '#91f1e5'},
  condensation: {label: 'Vapour → droplets', x: 525, y: 89, fill: '#e0fbff'},
  precipitation: {label: 'Cloud → land', x: 621, y: 544, fill: '#b6ebff'},
  collection: {label: 'Land → ocean', x: 385, y: 760, fill: '#79f6db'},
};

export function Landscape({active, time, reveal, dropletCloseup}: {active: string; time: number; reveal: number; dropletCloseup?: boolean}) {
  const label = stages[active as keyof typeof stages] ?? stages.cycle;
  const intensity = (stage: string) => (active === 'cycle' || active === stage ? 0.25 + 0.75 * reveal : 0);
  const cloudOffset = Math.sin(time * 0.48) * 15;

  return (
    <svg viewBox="0 0 840 950" width="100%" role="img" aria-label={label.label} style={{display: 'block'}}>
      <defs>
        <linearGradient id="sky" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#112c48"/><stop offset="1" stopColor="#367989"/></linearGradient>
        <linearGradient id="sea" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#208d9c"/><stop offset="1" stopColor="#0a3c57"/></linearGradient>
        <linearGradient id="hill" x2="0" y2="1" gradientUnits="objectBoundingBox"><stop stopColor="#9abd9d"/><stop offset="1" stopColor="#285d5a"/></linearGradient>
        <radialGradient id="warmth"><stop stopColor="#ffdf95" stopOpacity=".46"/><stop offset="1" stopColor="#ffdf95" stopOpacity="0"/></radialGradient>
      </defs>
      <rect width="840" height="950" fill="url(#sky)"/>
      <circle cx="188" cy="248" r={150 + 11 * Math.sin(time * 1.4)} fill="url(#warmth)"/>
      <circle cx="188" cy="248" r="59" fill="#ffd88a"/>
      <path d="M0 605Q125 530 231 597T425 584L556 400 618 476 700 315 840 502V808H0Z" fill="#507f82"/>
      <path d="M306 675 473 537 512 559 624 437 659 472 717 394 840 591V840H274Z" fill="url(#hill)"/>
      <path d="m678 445 39-51 44 71-40-23-19 16Z" fill="#deefe4"/>
      <path d="M0 661Q155 614 310 680Q464 742 520 821L840 950H0Z" fill="url(#sea)"/>
      <path d="M730 527C571 553 665 621 540 646S508 712 377 742Q325 750 272 776" fill="none" stroke="#1b6c76" strokeWidth="38" strokeLinecap="round"/>
      <path d="M730 527C571 553 665 621 540 646S508 712 377 742Q325 750 272 776" fill="none" stroke="#6ee4d1" strokeWidth="18" strokeLinecap="round" opacity=".75"/>
      {count(7).map(i => {
        const x = 26 + i % 3 * 112 + 15 * Math.sin(time * 1.3 + i);
        return <path key={i} d={`M${x} ${716 + i * 28}q24-11 52 0t46 0`} stroke="#9df9ed" opacity={0.18 + i % 2 * 0.19} strokeWidth="4" fill="none" strokeLinecap="round"/>;
      })}
      <g opacity={intensity('evaporation')}>
        {count(22).map(i => {
          const p = phase(time, i * 0.41, 3.9);
          return <circle key={i} cx={75 + i % 8 * 22 + p * 198 + Math.sin(p * 7 + i) * 24} cy={665 - p * 421} r={3 + (i % 4) * 1.5} opacity={Math.sin(p * Math.PI)} fill="#aaf8ed"/>;
        })}
      </g>
      <g opacity={intensity('condensation')}>
        {count(19).map(i => {
          const p = phase(time, i * 0.34, 3.4);
          return <circle key={i} cx={517 + cloudOffset + Math.cos(i * 2.4) * (160 - 130 * p)} cy={258 + Math.sin(i * 2.4) * (126 - 102 * p)} r={3 + p * 4} opacity={Math.sin(p * Math.PI)} fill="#d9faff"/>;
        })}
      </g>
      <g transform={`translate(${cloudOffset}, 0)`}>
        <path d="M361 302c-35-5-36-68 19-75 2-51 63-77 98-41 35-72 135-49 146 15 61-7 94 34 74 73-7 15-23 28-46 28Z" fill="#a7cdd9" opacity=".48" transform="translate(12 19)"/>
        <path d="M361 302c-35-5-36-68 19-75 2-51 63-77 98-41 35-72 135-49 146 15 61-7 94 34 74 73-7 15-23 28-46 28Z" fill="#e6f5ee"/>
        <path d="M407 264c27-33 62-44 99-31 25-41 75-53 111-29" fill="none" stroke="#fffefa" strokeWidth="11" strokeLinecap="round"/>
      </g>
      <g opacity={intensity('precipitation')} stroke="#a7edff" strokeWidth="5" strokeLinecap="round">
        {count(24).map(i => {
          const p = phase(time, i * 0.21, 1.6);
          const x = 432 + i % 10 * 24 - 32 * p;
          const y = 322 + p * 288;
          return <path key={i} d={`M${x} ${y}l-7 23`} opacity={Math.sin(p * Math.PI)}/>;
        })}
      </g>
      <path d="M730 527C571 553 665 621 540 646S508 712 377 742Q325 750 272 776" pathLength={100} strokeDasharray="3 8" strokeDashoffset={-time * 24} fill="none" stroke="#c8fff4" opacity={intensity('collection')} strokeWidth="12" strokeLinecap="round"/>
      {dropletCloseup && active === 'condensation' && (
        <g opacity={reveal} transform="translate(298 493)">
          <path d="M100-104 194-211" stroke="#dbfafa" strokeWidth="3" fill="none"/>
          <circle r="148" fill="#112f48" stroke="#9be2dc" strokeWidth="5"/>
          <circle r={24 + 30 * reveal} fill="#6aceda" stroke="#d8ffff" strokeWidth="3"/>
          <circle r="9" fill="#d0ae89"/>
          {count(13).map(i => {
            const progress = phase(time, i * 0.61, 3.1);
            const radius = 125 - 78 * progress;
            const angle = i * 2.4;
            return <circle key={i} cx={radius * Math.cos(angle)} cy={radius * Math.sin(angle)} r="4" fill="#caf7ff" opacity={Math.sin(progress * Math.PI)}/>;
          })}
          <text y="200" textAnchor="middle" fill="#fff" stroke="#183548" strokeWidth="6" paintOrder="stroke" fontWeight="700" fontSize="29">Droplet around a particle</text>
        </g>
      )}
      <g transform={`translate(${label.x} ${label.y + (1 - reveal) * 16})`} opacity={reveal}>
        <rect x="-151" y="-28" width="302" height="56" rx="28" fill="#102e42" stroke={label.fill} strokeOpacity=".5"/>
        <text textAnchor="middle" dominantBaseline="central" fontSize="26" fontWeight="700" fill={label.fill}>{label.label}</text>
      </g>
    </svg>
  );
}
