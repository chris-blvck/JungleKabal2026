import React, { useEffect, useMemo, useState } from 'react';
const HERO_GIF_URL = 'https://i.postimg.cc/Zq4VSHsY/Chat-GPT-Image-12-janv-2026-13-58-41.png';
const KASH_MACHINE_VISUAL = 'https://i.postimg.cc/bwDLcTFD/KKM-Demo.gif';
const JUNGLE_KABAL_LOGO = 'https://i.postimg.cc/qvwCbYc2/Logo-JK-Transparent-full.png';
const JUNGLE_KABAL_EYE = 'https://i.postimg.cc/hPqzSgpC/logo-jaune-rond.png';
const MEMBER_GRID_EYE = 'https://i.postimg.cc/sD42KF0v/Logo-Eye-Hologram-Transparent.png';
const Kabalian = '1111';
const KKM = 'https://i.postimg.cc/sxqcPqK6/Chat-GPT-Image-2-janv-2026-15-40-15-(1).png';
const DIVIDER_100X = 'https://i.postimg.cc/ncLKMFV0/Chat-GPT-Image-5-janv-2026-22-57-33-(1).png';
const DIVIDER_VINE = 'https://i.postimg.cc/XJxBYQrg/divider-liane.png';
const DIVIDER_MAGIC = 'https://i.postimg.cc/mkJDPqB1/divider-2.png';
const DIVIDER_RED = 'https://i.postimg.cc/BnGSR26s/Chat-GPT-Image-12-janv-2026-19-28-23.png';
const CHOSEN_ONE = 'https://i.postimg.cc/c4BM7sg5/Kabalian-Chosen-one.png';
const Divider3 = 'https://i.postimg.cc/ncLKMFV0/Chat-GPT-Image-5-janv-2026-22-57-33-(1).png';
const KKM_EASY_MONEY = 'https://i.postimg.cc/xdJyYHf4/Chat-GPT-Image-8-janv-2026-18-36-54.png';
const KABAL_STYLE_VISUAL = 'https://i.postimg.cc/cHfRtS8T/Chat-GPT-Image-8-janv-2026-22-22-02.png';
const HERO_GREEN_CANDLE = 'https://i.postimg.cc/dV0d8GKJ/Chat-GPT-Image-8-janv-2026-22-42-35-(1).png';
const KABAL_COMES_FIRST = 'https://i.postimg.cc/d3BGnj6N/Chat-GPT-Image-8-janv-2026-20-45-41.png';
const KABAL_FLAG = 'https://i.postimg.cc/Tw5kkF5b/Kabal-Flag-V2.png';
const ORNAMENT_TILE = 'https://i.postimg.cc/ydM6BGKP/Chat-GPT-Image-25-nov-2025-11-52-43-(1).png';

const styles = `
@keyframes junglePulse {
  0% { opacity: 1; }
  50% { opacity: 0.65; }
  100% { opacity: 1; }
}
@keyframes buttonPulse {
  0% { box-shadow: 0 0 0 0 rgba(255,195,0,0.6); }
  70% { box-shadow: 0 0 0 14px rgba(255,195,0,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,195,0,0); }
}
@keyframes glowPulse {
  0% { box-shadow: 0 0 18px rgba(255, 195, 0, 0.1); }
  50% { box-shadow: 0 0 32px rgba(255, 195, 0, 0.35); }
  100% { box-shadow: 0 0 18px rgba(255, 195, 0, 0.1); }
}
.pulse-shadow {
  animation: glowPulse 6s ease-in-out infinite;
}
@keyframes marqueeScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.member-card {
  position: relative;
  overflow: hidden;
}
.member-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--eye-overlay);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 70%;
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}
.member-card:hover::after {
  opacity: 0.12;
  transform: scale(1);
}
.chapter-banner {
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}
.image-crisp {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}
.pain-statement::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--pain-glyph);
  background-repeat: no-repeat;
  background-position: center;
  background-size: 45%;
  opacity: 0.06;
  pointer-events: none;
}
.scroll-container {
  scroll-snap-type: y mandatory;
  scroll-padding-top: 120px;
}
.scroll-section {
  scroll-snap-align: start;
  transform: translateY(26px) scale(0.98);
  transition: transform 0.5s ease;
}
.scroll-section.is-active {
  transform: translateY(0) scale(1);
}
.ornament-slot {
  display: flex;
  height: 64px;
  width: 64px;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: #0f0f0f;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
}
.ornament-slot img {
  opacity: 0.75;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.4));
}
.floating-card {
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}
.floating-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 24px 60px rgba(255, 195, 0, 0.12), 0 18px 45px rgba(0, 0, 0, 0.55);
}
.floating-media {
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
  transition: transform 0.35s ease, box-shadow 0.35s ease;
}
.floating-media:hover {
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 30px 90px rgba(255, 195, 0, 0.12), 0 24px 70px rgba(0, 0, 0, 0.55);
}
.marquee {
  overflow: hidden;
}
.marquee-track {
  display: flex;
  width: max-content;
  animation: marqueeScroll 38s linear infinite;
}
.marquee-track--slow {
  animation-duration: 55s;
}
.marquee-track:hover {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .scroll-section {
    opacity: 1;
    transform: none;
    transition: none;
  }
  .marquee-track {
    animation: none;
  }
  .floating-card,
  .floating-media {
    transform: none;
    transition: none;
  }
}
`;

const MEMBER_PFPS = [
  'https://i.postimg.cc/4NNhtkFF/IMG-6761.jpg',
  'https://i.postimg.cc/xC2X1Wz6/2026-01-07-11-03-58.jpg',
  'https://i.postimg.cc/HxdLgXqK/2026-01-07-11-04-29.jpg',
  'https://i.postimg.cc/2S4v7ZB1/alan-b.jpg',
  'https://i.postimg.cc/4xztQ9hH/bricks.jpg',
  'https://i.postimg.cc/g2vRHZ6h/cryo-palmar.jpg',
  'https://i.postimg.cc/RZcfLHnf/delblondo.jpg',
  'https://i.postimg.cc/FHjcVLJL/diego.jpg',
  'https://i.postimg.cc/3xgpFvDX/dr-bluechip.jpg',
  'https://i.postimg.cc/13p6rqNr/dylan-dks-founder.jpg',
  'https://i.postimg.cc/XYwFkCyK/escoba.jpg',
  'https://i.postimg.cc/SxW8fMzr/flawks.jpg',
  'https://i.postimg.cc/3wYGSxgG/grip.jpg',
  'https://i.postimg.cc/wBgNfjhm/hanko.jpg',
  'https://i.postimg.cc/g0mhS2vV/huatrabbit.jpg',
  'https://i.postimg.cc/HLdMZkQZ/oro.jpg',
  'https://i.postimg.cc/Bv4FYnxh/nico-motd.jpg',
  'https://i.postimg.cc/GpdD7mkV/steve.jpg',
  'https://i.postimg.cc/6QtZjpd0/justin-dks.jpg',
  'https://i.postimg.cc/SKk9TxWf/moon-moon.jpg',
  'https://i.postimg.cc/tgp6S4hh/jemmy.jpg',
  'https://i.postimg.cc/bvpnCwQM/sailor.jpg',
  'https://i.postimg.cc/8CNvKzRQ/tenders.jpg',
  'https://i.postimg.cc/7LwzsZgW/oracle-magic-eden.jpg',
  'https://i.postimg.cc/mrB9XgQv/thana-videographer.jpg',
  'https://i.postimg.cc/k5qS1gxF/meta-dev5.jpg',
  'https://i.postimg.cc/25rWcS40/pat.jpg',
  'https://i.postimg.cc/9fC98QGk/sharp.jpg',
  'https://i.postimg.cc/6QtZjprx/zeud.jpg',
];

const KABALIAN_TWITTER_LIST = 'https://x.com/i/lists/1918361575116947818';

const MEMBERS = [
  {
    name: 'CHRIS BLACK',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[0],
  },
  {
    name: 'TORLIN',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[1],
  },
  {
    name: 'FIONA',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[2],
  },
  {
    name: 'ALAN B.',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[3],
  },
  {
    name: 'BRICKS',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[4],
  },
  {
    name: 'CRYO PALMAR',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[5],
  },
  {
    name: 'DELBLONDO',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[6],
  },
  {
    name: 'DIEGO',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[7],
  },
  {
    name: 'DR. BLUECHIP',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[8],
  },
  {
    name: 'DYLAN',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[9],
  },
  {
    name: 'ESCOBA',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[10],
  },
  {
    name: 'FLAWKS',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[11],
  },
  {
    name: 'GRIP',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[12],
  },
  {
    name: 'HANKO',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[13],
  },
  {
    name: 'HUATRABBIT',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[14],
  },
  {
    name: 'ORO',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[15],
  },
  {
    name: 'NICO MOTD',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[16],
  },
  {
    name: 'STEVE',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[17],
  },
  {
    name: 'JUSTIN',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[18],
  },
  {
    name: 'JADE',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[19],
  },
  {
    name: 'JEMMY',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[20],
  },
  {
    name: 'SAILOR',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[21],
  },
  {
    name: 'TENDERS',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[22],
  },
  {
    name: '0RACLE',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[23],
  },
  {
    name: 'THANA',
    twitter: KABALIAN_TWITTER_LIST,
    role: 'Kabal Member',
    avatar: MEMBER_PFPS[24],
  },
];

const RESULTS = [
  'https://i.postimg.cc/WFgyYGdW/Frame-2-(1).png',
  'https://i.postimg.cc/34mqfXkV/Frame-2-(2).png',
  'https://i.postimg.cc/ZBpQs8Wg/Frame-2-(3).png',
  'https://i.postimg.cc/Fd36CyY2/Frame-2-(4).png',
  'https://i.postimg.cc/JDZFYNsS/Frame-2-(5).png',
];
const PNL_VERTICAL_IMAGE = 'https://i.postimg.cc/52fKgH27/G9-IUEnbc-AUYw-Lw.jpg';
const PNL_VERTICAL_RESULTS = Array.from({ length: 20 }, () => PNL_VERTICAL_IMAGE);

function CTAButton({ label, className = '' }) {
  return (
    <button
      data-tally-open="BzdNYK"
  data-tally-width="600"
  data-tally-overlay="1"
  data-tally-emoji-text="🌴"
  data-tally-emoji-animation="rubber-band"
  style={{ animation: 'buttonPulse 3s infinite' }}
  className={`inline-flex items-center justify-center rounded-full bg-[#ffc300] px-10 py-4 text-lg font-semibold text-black shadow-lg transition hover:bg-[#ffd65a] ${className}`}
>
      {label}
    </button>
  );
}

const KABAL_TEAM_MEMBERS = [
  {
    name: "CHRIS 'REX' BLACK",
    role: 'Founder',
    avatar: 'https://i.postimg.cc/zGf8FwDv/Chris-Rex-Black.jpg',
  },
  {
    name: 'CHIRAG',
    role: 'Kore Team (Growth)',
    avatar: 'https://i.postimg.cc/j26kG1cs/chirag.jpg',
  },
  {
    name: 'KAIZZEN',
    role: 'Kore Team (Trader)',
    avatar: 'https://i.postimg.cc/28zH12TW/kaizen.jpg',
  },
  {
    name: 'MR CARILLO',
    role: 'Kore Team (Trader)',
    avatar: 'https://i.postimg.cc/R0ndk8Cd/Mr-Carrillo.jpg',
  },
  {
    name: 'KRUMIZ',
    role: 'Kore Team (Ops)',
    avatar: 'https://i.postimg.cc/gcKsb3dm/Krumiz.jpg',
  },
  {
    name: 'STAY NOTHING',
    role: 'Kore Team (Growth)',
    avatar: 'https://i.postimg.cc/sx0ZDjwY/stay-nothing-jungle-kabal-team.jpg',
  },
  {
    name: 'MPF',
    role: 'Developer',
    avatar: 'https://i.postimg.cc/P5CQDcDH/Mpg.jpg',
  },
  {
    name: 'FIONA',
    role: 'Designer',
    avatar: 'https://i.postimg.cc/xCMszZWy/Fiona.jpg',
  },
  {
    name: 'TORLIN',
    role: 'Twitter Intern',
    avatar: 'https://i.postimg.cc/43B4T88f/Torlin.jpg',
  },
  {
    name: 'SEVEN',
    role: 'BD',
    avatar: 'https://i.postimg.cc/8ckhznD5/Seven-Kabal-team.jpg',
  },
  {
    name: 'QUACKDUCK',
    role: 'BD',
    avatar: 'https://i.postimg.cc/0QPSVHz0/quackduck-team-kabal.jpg',
  },
  {
    name: 'LONGLIFE',
    role: 'Low Cap Scout',
    avatar: 'https://i.postimg.cc/0NmGWwZc/longlife.jpg',
  },
  {
    name: 'THANA',
    role: 'Videomaker',
    avatar: 'https://i.postimg.cc/1RTttjyf/thana-videographer.jpg',
  },
  {
    name: 'ANONYMOS',
    role: 'Angel Advisor',
    avatar: 'https://i.postimg.cc/.jpg',
  },
  {
    name: 'HASZISZ',
    role: 'Team Research',
    avatar: 'https://i.postimg.cc/QMsVDKhP/haszisz.jpg',
  },
];

const KABAL_TEAM_PLACEHOLDERS = Array.from({ length: 5 }, (_, index) => ({
  name: `Kabalian ${index + 1}`,
  role: '',
  avatar: '',
  isPlaceholder: true,
}));

const KABAL_TEAM = [...KABAL_TEAM_MEMBERS, ...KABAL_TEAM_PLACEHOLDERS];

const PAIN_POINTS = [
  'You watched a 1000x pump and did nothing.',
  'You spend time watching markets, but execution stays inconsistent.',
  'Your capital sleeps because you lack the structure to deploy it properly.',
];



const KKM_STEPS_DATA = [
  {
    title: 'Step 1: Kabal team scouts',
    image: 'https://i.postimg.cc/sfYcPc5f/Kabal-Scouting-v2.png',
    alt: 'Kabal scouting',
    description:
      'The Kabal team manually scouts new opportunities. They decide what to trade, when to enter, and when to exit.',
  },
  {
    title: 'Step 2: KKM copies the trade',
    image: 'https://i.postimg.cc/Mpjq4hs2/Chat-GPT-Image-12-janv-2026-16-59-34.png',
    alt: 'KKM execution',
    description: 'KKM mirrors the trade to copytraders instantly, based on each user’s preset.',
  },
  {
    title: 'Step 3: Exit full auto or manual',
    image: 'https://i.postimg.cc/7PRxV34n/kkm-eazy-moni-transparent.png',
    alt: 'KKM exits',
    description:
      'When the Kabal team exits, copytraders can exit automatically or manage the position manually.',
  },
];


const KKM_CONTROL_MODES = [
  {
    label: 'Full Auto',
    image: 'https://i.postimg.cc/MpXBh38V/IMG-4364.jpg',
    alt: 'Full auto mode',
  },
  {
    label: 'Semi-Auto',
    image: 'https://i.postimg.cc/qR2y1tHF/IMG-4365.jpg',
    alt: 'Semi-auto mode',
    recommended: true,
  },
  {
    label: 'Manual',
    image: 'https://i.postimg.cc/mkwMG0DM/IMG-4366.jpg',
    alt: 'Manual mode',
  },
];

const KKM_DIFFERENCES = [
  {
    title: '🔒 Private by design',
    description: 'KKM is not public. Access is manually approved.',
    icon: '🛡️',
  },
  {
    title: '🧠 Human edge',
    description:
      'Trades are executed by real, trained humans with months of proven results. No random bots.',
    icon: '🧬',
  },
  {
    title: '🤝 Aligned incentives',
    description:
      'The Kabal team and copytraders win or lose together. The community comes first. Capital is protected collectively.',
    icon: '🔗',
  },
];

const FIXED_MEMBERS_COUNT = 15;
const MEMBERS_PAGE_SIZE = 30;
const TOTAL_MEMBERS_COUNT = 300;

const ORNAMENTS = [
  { src: JUNGLE_KABAL_EYE, alt: 'Kabal eye ornament' },
  { src: ORNAMENT_TILE, alt: 'Ornament tile' },
  { src: KKM_EASY_MONEY, alt: 'Kabal charm ornament' },
];

function MembersGrid() {
  const [currentPage, setCurrentPage] = useState(1);
  const randomizedMembers = useMemo(() => {
    const fixedMembers = MEMBERS.slice(0, FIXED_MEMBERS_COUNT);
    const randomPool = MEMBERS.slice(FIXED_MEMBERS_COUNT);
    const shuffledPool = [...randomPool];
    for (let i = shuffledPool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPool[i], shuffledPool[j]] = [shuffledPool[j], shuffledPool[i]];
    }

    const placeholdersNeeded = Math.max(TOTAL_MEMBERS_COUNT - MEMBERS.length, 0);
    const placeholders = Array.from({ length: placeholdersNeeded }, (_, index) => ({
      name: 'Kabalian',
      role: 'Kabal Member',
      twitter: '',
      isPlaceholder: true,
      id: `placeholder-${index + 1}`,
    }));

    return [...fixedMembers, ...shuffledPool, ...placeholders];
  }, []);
  const totalPages = Math.max(Math.ceil(randomizedMembers.length / MEMBERS_PAGE_SIZE), 1);
  const clampedPage = Math.min(currentPage, totalPages);
  const displayedMembers = randomizedMembers.slice(
    (clampedPage - 1) * MEMBERS_PAGE_SIZE,
    clampedPage * MEMBERS_PAGE_SIZE
  );
  const visibleCount = displayedMembers.length;

  return (
    <div className="mt-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-4xl font-title font-semibold text-[#ffc300]">Kabalians (Kabal Members)</h2>
        <p className="text-sm text-gray-400">
          Click a name to visit their Twitter. 
        </p>
        <p className="text-xs text-gray-500">
          Showing {visibleCount} of {randomizedMembers.length} members.
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {displayedMembers.map((member, index) => {
          const shouldUseEye = member.isPlaceholder || !member.avatar;
          const avatarSrc = shouldUseEye ? MEMBER_GRID_EYE : member.avatar;
          const displayName = member.isPlaceholder ? 'Kabalian' : member.name;
          const displayRole = member.role;
          const cardClassName =
            'member-card floating-card flex flex-col items-center gap-2 rounded-2xl border border-[#1f1f1f] bg-[#111111] px-3 py-4 text-center text-sm text-gray-200 transition hover:border-[#ffc300] hover:text-[#ffc300]';
          const content = (
            <>
              <img
                src={avatarSrc}
                alt={`${displayName} avatar`}
                className="h-14 w-14 rounded-full object-cover"
              />
              <span className="text-xs font-medium uppercase tracking-wide text-gray-300">
                {displayName}
              </span>
              <span className="text-[11px] text-gray-500">- {displayRole}</span>
            </>
          );

          if (member.twitter) {
            return (
              <a
                key={member.id ?? member.name}
                href={member.twitter}
                target="_blank"
                rel="noreferrer"
                className={cardClassName}
                style={{ '--eye-overlay': `url(${MEMBER_GRID_EYE})` }}
              >
                {content}
              </a>
            );
          }

          return (
            <div
              key={member.id ?? `${displayName}-${index}`}
              className={cardClassName}
              style={{ '--eye-overlay': `url(${MEMBER_GRID_EYE})` }}
            >
              {content}
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-400">
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
          disabled={clampedPage === 1}
          className="rounded-full border border-[#2b2b2b] px-3 py-1 text-xs font-semibold text-white transition hover:border-[#ffc300] hover:text-[#ffc300] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Prev
        </button>
        <span className="rounded-full border border-[#1f1f1f] bg-[#111111] px-3 py-1">
          Page {clampedPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
          disabled={clampedPage === totalPages}
          className="rounded-full border border-[#2b2b2b] px-3 py-1 text-xs font-semibold text-white transition hover:border-[#ffc300] hover:text-[#ffc300] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function KabalTeamGrid() {
  return (
    <div className="mt-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-4xl font-title font-semibold text-[#ffc300]">Kabal Team</h2>
        <p className="text-sm text-gray-400">The core operators behind Jungle Kabal.</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {KABAL_TEAM.map((member) => (
          <div
            key={member.name}
            className="member-card floating-card flex flex-col items-center gap-2 rounded-2xl border border-[#1f1f1f] bg-[#111111] px-3 py-4 text-center text-sm text-gray-200"
            style={{ '--eye-overlay': `url(${MEMBER_GRID_EYE})` }}
          >
            <img
              src={member.avatar || JUNGLE_KABAL_EYE}
              alt={`${member.name} avatar`}
              className="h-12 w-12 rounded-full object-cover"
            />
            {!member.isPlaceholder ? (
              <>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-300">
                  {member.name}
                </span>
                <span className="text-[11px] text-gray-500">- {member.role}</span>
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultsCarousel() {
  const resultsLoop = useMemo(() => [...RESULTS, ...RESULTS], []);

  return (
    <div className="mt-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-4xl font-title font-semibold text-[#ffc300]">
          Calls dropped in the Kabal (by Kabal Research team)
        </h2>
        <p className="text-sm text-gray-400">(by kabal team)</p>
      </div>

      {/* Full-bleed carousel */}
      <div className="relative mt-8 left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen">
        {/* Scroll gradients (visual hint) */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0d0f0d] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0d0f0d] to-transparent" />

        {/* Cards */}
        <div className="marquee px-8 pb-6">
          <div className="marquee-track gap-6">
            {resultsLoop.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="floating-card min-w-[220px] md:min-w-[300px] lg:min-w-[360px] rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] p-3 shadow-lg"
              >
                <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-black">
                  <img
                    src={image}
                    alt={`PNL result ${index + 1}`}
                    className="h-full w-full object-contain"
                    style={{ imageRendering: 'auto', filter: 'none' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Optional hint text */}
      <div className="mt-4 flex flex-col items-center justify-center gap-2 text-center text-xs text-gray-500">
        <span>Scroll →</span>
        <img src={JUNGLE_KABAL_EYE} alt="Jungle Kabal eye logo" className="h-10 w-10 object-contain" />
      </div>
      <img src={DIVIDER_100X} alt="DIVIDER_100X" className="mx-auto mt-6 h-72 w-72 object-contain" />
    </div>

  );
}

function FloatingDivider({ image, alt, className = '' }) {
  return (
    <section data-scroll-section className="scroll-section flex justify-center">
      <img
        src={image}
        alt={alt}
        className={`floating-media mx-auto h-48 w-48 object-contain md:h-56 md:w-56 ${className}`}
      />
    </section>
  );
}

function VerticalResultsCarousel() {
  const verticalLoop = useMemo(() => [...PNL_VERTICAL_RESULTS, ...PNL_VERTICAL_RESULTS], []);

  return (
    <div className="mt-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-4xl font-title font-semibold text-[#ffc300]">PNL Highlights</h3>
        <p className="text-sm text-gray-400">Vertical format results preview.</p>
      </div>
      <div className="relative mt-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-[#0d0f0d] to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-[#0d0f0d] to-transparent" />
        <div className="marquee overflow-x-auto px-6 pb-6">
          <div className="marquee-track marquee-track--slow gap-3">
            {verticalLoop.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="floating-card min-w-[26px] md:min-w-[30px] lg:min-w-[34px] rounded-2xl border border-[#1f1f1f] bg-[#0f0f0f] p-1 shadow-lg transition hover:scale-105"
              >
                <div className="aspect-[9/16] w-full overflow-hidden rounded-xl bg-black">
                  <img
                    src={image}
                    alt={`Vertical PNL result ${index + 1}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-col items-center justify-center gap-2 text-center text-xs text-gray-500">
        <span>Scroll →</span>
        <img src={JUNGLE_KABAL_EYE} alt="Jungle Kabal eye logo" className="h-8 w-8 object-contain" />
      </div>
    </div>
  );
}




export default function LandingPage() {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('[data-scroll-section]'));
    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.35, rootMargin: '0px 0px -40% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
<main
  className="scroll-container min-h-screen bg-[#0d0f0d] text-white font-body scroll-smooth"
  style={{
    backgroundImage: 'url(https://i.postimg.cc/4yfhQzR0/backgroudn-website.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center top',
    backgroundRepeat: 'no-repeat',
  }}
>
  <style>{styles}</style>
      <div className="relative mx-auto w-full max-w-6xl px-6 py-16">
        <div className="relative flex flex-col gap-40">
        <section
          id="hero"
          data-scroll-section
          className={`scroll-section flex flex-col items-center gap-8 text-center ${activeSection === 'hero' ? 'is-active' : ''}`}
        >
          <img
            src={HERO_GIF_URL}
            alt="Kabal K Rex header"
            className="floating-media pulse-shadow mx-auto w-full max-w-3xl rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.6)]"
          />
          <img
            src={JUNGLE_KABAL_LOGO}
            alt="Jungle Kabal transparent logo"
            className="mx-auto w-full max-w-md drop-shadow-[0_0_25px_rgba(255,195,0,0.25)]"
          />
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#111111] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#ffc300]">
            <span>🔒</span>
            MEMBERS CLOSED
          </div>
          <div className="space-y-4">
        <h1
  className="text-4xl font-bold font-title tracking-wide text-[#ffc300] md:text-5xl"
  style={{ animation: 'junglePulse 7s ease-in-out infinite' }}
>
  🧿 WILL THE JUNGLE CHOOSE YOU ? 🧿
</h1>
            <p className="text-lg text-gray-200 md:text-xl">
Jungle Kabal is a private Telegram trading syndicate focused on the Solana ecosystem.
</p>
<p className="text-sm text-gray-400 md:text-base">
Members are hanpicked,they share ideas, discuss trades, and access internal hands-free trading tools.
</p>

            
          </div>
          <CTAButton label=" ✍️ Apply to be Chosen 📜" className="pulse-shadow" />
            <p>Access to new members is stricly limited and approved manually.</p>
          <img src={CHOSEN_ONE} alt="CHOSEN ONE" className="mx-auto h-48 w-48 object-contain" />
          <div className="mt-6 grid w-full gap-6 text-left sm:grid-cols-3">
            <div className="floating-card flex flex-col items-start rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 text-sm text-gray-300 shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0f0f0f]">
                <img src={JUNGLE_KABAL_EYE} alt="Kabal eye" className="h-7 w-7 object-contain" />
              </div>
              <p className="text-base font-semibold text-white">A curated environment</p>
              <p className="mt-4 leading-relaxed">
                A private group built around clear standards.
                <br />
                    <br />
                No pump culture. No public calls spam.
                <br />
                    <br />
                Members are selected for mindset, values and long-term alignment.
              </p>
            </div>
            <div className="floating-card flex flex-col items-start rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 text-sm text-gray-300 shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0f0f0f]">
                <img src={JUNGLE_KABAL_EYE} alt="Kabal eye" className="h-7 w-7 object-contain" />
              </div>
              <p className="text-base font-semibold text-white">A shared code</p>
              <p className="mt-4 leading-relaxed">
                The Kabal follows a common Kode.
                <br />
                    <br />
                How we act, how we trade, how we manage risk.
                <br />
                    <br />
                The Kode matters more than any single trade.
              </p>
            </div>
            <div className="floating-card flex flex-col items-start rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 text-sm text-gray-300 shadow-lg">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0f0f0f]">
                <img src={JUNGLE_KABAL_EYE} alt="Kabal eye" className="h-7 w-7 object-contain" />
              </div>
              <p className="text-base font-semibold text-white">Access to internal systems</p>
              <p className="mt-4 leading-relaxed">
                Members get access to tools and infrastructure developed inside the Kabal.
                <br />
                    <br />
                These systems are not public and are not explained outside the group.
            
              </p>
            </div>
          </div>
        </section>

        <section data-scroll-section className="scroll-section flex flex-col items-center gap-4 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[#ffc300]">Before ....</p>
          <FloatingDivider image={DIVIDER_RED} alt="Divider ornament" className="h-80 w-80 md:h-96 md:w-96" />
        </section>

        <section
          id="pain"
          data-scroll-section
          className={`scroll-section pain-statement relative overflow-hidden rounded-[32px] border border-[#1c1c1c] bg-[#0b0c0b] px-6 py-16 text-center shadow-[0_20px_80px_rgba(0,0,0,0.55)] ${activeSection === 'pain' ? 'is-active' : ''}`}
          style={{ '--pain-glyph': `url(${JUNGLE_KABAL_EYE})` }}
        >
          <div className="relative z-10 mx-auto max-w-3xl space-y-6">
            <p className="text-2xl font-semibold text-white md:text-3xl">
              You’re either losing money through poor trading execution / mindset 
            </p>
            <p className="text-2xl font-semibold text-[#ffc300] md:text-3xl">
              or leaving capital sleeping without a clear way to deploy it.
            </p>
          </div>
          <div className="relative z-10 mx-auto mt-8 grid max-w-5xl gap-4 text-left sm:grid-cols-3">
            {PAIN_POINTS.map((point) => (
              <div
                key={point}
                className="floating-card rounded-2xl border border-[#2a2a2a] bg-[#101010] p-5 text-sm text-gray-200 shadow-lg"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ffc300]">
                  👇 
                </p>
                <p className="mt-3 text-base leading-relaxed text-white">{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section data-scroll-section className="scroll-section flex flex-col items-center gap-4 text-center">
          <img
            src={HERO_GREEN_CANDLE}
            alt="Hero green candle"
            className="floating-media mx-auto w-full max-w-sm rounded-3xl border border-[#1f1f1f] object-cover"
          />
          <div className="rounded-full border border-[#1f1f1f] bg-[#111111] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffc300]">
            Until the Kabal Found you
          </div>
          <div className="mx-auto max-w-2xl space-y-3 text-gray-300">
            <p>The problem isn’t a lack of information.</p>
            <p>It’s making decisions alone, in a market that never slows down.</p>
          
          </div>
        </section>

        <section data-scroll-section className="scroll-section flex justify-center">
          <img
            src={KABAL_STYLE_VISUAL}
            alt="Kabal style visual"
            className="floating-media mx-auto w-full max-w-xl rounded-3xl border border-[#1f1f1f] object-cover"
          />
        </section>

        <section data-scroll-section className="scroll-section flex justify-center">
          <img
            src={DIVIDER_VINE}
            alt="Divider 1"
            className="mx-auto w-full max-w-4xl object-contain"
          />
        </section>

        <section
          id="members"
          data-scroll-section
          className={`scroll-section ${activeSection === 'members' ? 'is-active' : ''}`}
        >
          <MembersGrid />
        </section>

        <section data-scroll-section className="scroll-section">
          <KabalTeamGrid />
        </section>

        <section data-scroll-section className="scroll-section flex justify-center">
          <img
            src={DIVIDER_VINE}
            alt="Divider 1"
            className="mx-auto w-full max-w-4xl object-contain"
          />
        </section>

        <section
          id="kkm"
          data-scroll-section
          className={`scroll-section flex flex-col items-center gap-6 text-center ${activeSection === 'kkm' ? 'is-active' : ''}`}
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-title font-semibold text-[#ffc300]">
              How the Kabal Kash Machine (KKM) Works
            </h1>
            <p className="text-sm text-gray-400">
              The Kabal copytrading engine. Access limited only to approved Kabalians members.
            </p>
            <p className="text-sm text-gray-400">Built on Solana.</p>
          </div>
          <img
            src={KASH_MACHINE_VISUAL}
            alt="Kabal Kash Machine Demo"
            className="floating-media w-full max-w-3xl rounded-3xl border border-[#1f1f1f] object-cover"
          />
          <img src={KKM} alt="KKM" className="floating-media mx-auto h-96 w-96 object-contain" />
        </section>

        <section
          data-scroll-section
          className={`scroll-section flex flex-col items-center gap-10 text-center ${activeSection === 'kkm' ? 'is-active' : ''}`}
        >
          <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
            {KKM_STEPS_DATA.map((step) => (
              <div
                key={step.title}
                className="floating-card h-full rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#151515] via-[#101010] to-[#0b0b0b] p-6 text-left shadow-lg"
              >
                <p className="text-sm font-semibold text-[#ffc300]">{step.title}</p>
                <img
                  src={step.image}
                  alt={step.alt}
                  className="mx-auto mb-5 mt-5 h-48 w-48 object-contain"
                />
                <p className="text-sm text-gray-300">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">CONTROL MODES</h2>
          </div>
          <div className="flex flex-col gap-6 md:flex-row">
            {KKM_CONTROL_MODES.map((mode) => (
              <div
                key={mode.label}
                className={`floating-card relative flex-1 rounded-2xl border border-[#2a2a2a] bg-gradient-to-b from-[#151515] via-[#101010] to-[#0b0b0b] p-6 text-left shadow-lg ${
                  mode.recommended ? 'border-[#ffc300] shadow-[0_0_25px_rgba(255,195,0,0.35)]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{mode.label}</p>
                  {mode.recommended ? (
                    <span className="rounded-full border border-[#ffc300] px-2 py-1 text-xs text-[#ffc300]">
                      ⭐️ Recommended
                    </span>
                  ) : null}
                </div>
                <img
                  src={mode.image}
                  alt={mode.alt}
                  className="mt-4 w-full rounded-xl object-cover"
                />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold text-white">WHY KKM IS DIFFERENT</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {KKM_DIFFERENCES.map((item) => (
              <div
                key={item.title}
                className="floating-card rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 text-left shadow-lg"
              >
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-3 text-sm text-gray-300">{item.description}</p>
                <div className="mt-4 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0f0f0f] text-[#ffc300]">
                    {item.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <img src={KABAL_COMES_FIRST} alt="Kabal comes first" className="h-24 w-24 object-contain" />
        </section>

        <section data-scroll-section className="scroll-section flex justify-center">
          <img
            src={DIVIDER_VINE}
            alt="Divider 1"
            className="mx-auto w-full max-w-4xl object-contain"
          />
        </section>

        <section
          id="results"
          data-scroll-section
          className={`scroll-section ${activeSection === 'results' ? 'is-active' : ''}`}
        >
          <VerticalResultsCarousel />
        </section>

        <section
          data-scroll-section
          className={`scroll-section ${activeSection === 'results' ? 'is-active' : ''}`}
        >
          <ResultsCarousel />
        </section>

        <section data-scroll-section className="scroll-section flex justify-center">
          <img
            src={DIVIDER_VINE}
            alt="Divider 1"
            className="mx-auto w-full max-w-4xl object-contain"
          />
        </section>

        <section
          data-scroll-section
          className={`scroll-section flex justify-center ${activeSection === 'results' ? 'is-active' : ''}`}
        >
  <div className="w-full max-w-6xl px-4">
    <div className="floating-media overflow-hidden rounded-3xl border border-[#1f1f1f] bg-black">
      <img
        src="https://i.postimg.cc/NfhR2cdW/Chat-GPT-Image-4-janv-2026-19-13-09.png"
        alt="Jungle Kabal & KKM"
        className="w-full object-cover"
      />
    </div>
    </div>
        </section>

        <section
          id="apply"
          data-scroll-section
          className={`scroll-section flex flex-col items-center gap-4 rounded-[32px] border border-[#2a2a2a] bg-gradient-to-b from-[#141414] via-[#0f0f0f] to-[#0b0b0b] px-6 py-16 text-center shadow-[0_30px_80px_rgba(0,0,0,0.6)] ${activeSection === 'apply' ? 'is-active' : ''}`}
        >
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm uppercase tracking-[0.3em] text-[#ffc300]">Enter The Jungle</p>
            <p className="text-2xl font-title font-semibold text-[#ffc300]">
              Members are closed. Only way to enter is to Apply.
            </p>
          </div>
          <CTAButton label="Submit your Application" />
        </section>

        <section
          data-scroll-section
          className={`scroll-section flex justify-center ${activeSection === 'apply' ? 'is-active' : ''}`}
        >
          <img
            src={KABAL_FLAG}
            alt="Kabal flag banner"
            className="floating-media w-full max-w-4xl rounded-3xl border border-[#1f1f1f] object-cover"
          />
        </section>

        <FloatingDivider
          image={ORNAMENT_TILE}
          alt="Ornament tile"
          className="h-32 w-32 md:h-36 md:w-36"
        />

        <section data-scroll-section className="scroll-section flex flex-wrap justify-center gap-6">
          {ORNAMENTS.map((ornament) => (
            <div key={ornament.alt} className="ornament-slot">
              <img src={ornament.src} alt={ornament.alt} className="h-10 w-10 object-contain" />
            </div>
          ))}
        </section>

        <footer
          id="footer"
          data-scroll-section
          className={`scroll-section flex flex-col items-center gap-4 text-center text-sm text-gray-500 ${
            activeSection === 'footer' ? 'is-active' : ''
          }`}
        >
          <img src={JUNGLE_KABAL_EYE} alt="Jungle Kabal eye logo" className="h-14 w-14" />
          <p>Trading involves risk. Only trade what you can afford to lose.</p>
        </footer>
        </div>
      </div>
    </main>
  );
}
