const fs = require('fs');
const path = require('path');

const teamDir = path.join(__dirname, '..', 'assets', 'images', 'team');
if (!fs.existsSync(teamDir)) {
  fs.mkdirSync(teamDir, { recursive: true });
}

function createAvatar(name, initials, roleColor, bg1, bg2, accentColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160" fill="none">
  <defs>
    <linearGradient id="bg-${initials}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}" />
      <stop offset="100%" stop-color="${bg2}" />
    </linearGradient>
    <radialGradient id="glow-${initials}" cx="50%" cy="15%" r="75%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0" />
    </radialGradient>
    <clipPath id="clip-${initials}">
      <rect width="160" height="160" rx="24" />
    </clipPath>
  </defs>
  <g clip-path="url(#clip-${initials})">
    <rect width="160" height="160" fill="url(#bg-${initials})" />
    <rect width="160" height="160" fill="url(#glow-${initials})" />
    <rect x="0.5" y="0.5" width="159" height="159" rx="23.5" stroke="${accentColor}" stroke-opacity="0.25" stroke-width="1" />

    <!-- Minimalist Stylized Executive Silhouette -->
    <circle cx="80" cy="58" r="26" fill="#F8FAFC" fill-opacity="0.95" />
    <path d="M72 80 H88 V94 H72 Z" fill="#E2E8F0" fill-opacity="0.9" />
    <path d="M38 148 C38 108 54 94 80 94 C106 94 122 108 122 148 Z" fill="#FFFFFF" fill-opacity="0.92" />
    <path d="M68 94 L80 112 L92 94" stroke="${accentColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

    <!-- Monogram Pill Badge -->
    <rect x="44" y="126" width="72" height="22" rx="6" fill="#02060F" fill-opacity="0.9" stroke="${accentColor}" stroke-opacity="0.4" stroke-width="1" />
    <text x="80" y="141" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${initials}</text>
  </g>
</svg>`;
}

const avatars = [
  { file: 'founder-1.svg', name: 'Founder & Chief Architect', initials: 'FND-01', color: '#3B82F6', bg1: '#002869', bg2: '#001233', accent: '#60A5FA' },
  { file: 'founder-2.svg', name: 'Co-Founder & Systems Lead', initials: 'FND-02', color: '#0284C7', bg1: '#075985', bg2: '#082F49', accent: '#38BDF8' },
  { file: 'founder-3.svg', name: 'Founding Member & Scientist', initials: 'FND-03', color: '#6366F1', bg1: '#3730A3', bg2: '#1E1B4B', accent: '#818CF8' },
  { file: 'director-1.svg', name: 'Designated Director 1', initials: 'DIR-01', color: '#1E3A8A', bg1: '#1E293B', bg2: '#0F172A', accent: '#94A3B8' },
  { file: 'director-2.svg', name: 'Designated Director 2', initials: 'DIR-02', color: '#1E3A8A', bg1: '#1E293B', bg2: '#0F172A', accent: '#94A3B8' },
  { file: 'advisor-strategic.svg', name: 'Strategic Advisor', initials: 'ADV-01', color: '#4F46E5', bg1: '#3B387E', bg2: '#1E1B4B', accent: '#A5B4FC' },
  { file: 'advisor-equity.svg', name: 'Equity Advisor', initials: 'ADV-02', color: '#059669', bg1: '#065F46', bg2: '#022C22', accent: '#34D399' },
  { file: 'lead-bd.svg', name: 'Business Development Lead', initials: 'BD-01', color: '#2563EB', bg1: '#1D4ED8', bg2: '#172554', accent: '#93C5FD' },
  { file: 'lead-security.svg', name: 'Security Analyst', initials: 'SEC-01', color: '#D97706', bg1: '#78350F', bg2: '#451A03', accent: '#FBBF24' }
];

avatars.forEach(a => {
  fs.writeFileSync(path.join(teamDir, a.file), createAvatar(a.name, a.initials, a.color, a.bg1, a.bg2, a.accent));
  console.log(`Generated: ${a.file}`);
});
console.log('All 9 executive avatars generated successfully!');
