import { useState } from "react";

// ─── DESIGN TOKENS ──────────────────────────────────────────
const JK = {
  gold:    "#d49a2a",
  gold2:   "#efbc5b",
  goldDim: "#6d4610",
  bg:      "#060606",
  card:    "linear-gradient(180deg, rgba(18,13,8,0.96), rgba(10,10,10,0.99))",
  border:  "rgba(212,154,42,0.18)",
  border2: "rgba(212,154,42,0.38)",
  muted:   "#b7a186",
  mutedDim:"#7c6854",
  green:   "#28d96f",
  red:     "#e34a32",
  redSoft: "#ff8d73",
  white:   "#f3ede4",
};

// ─── PILLAR CONFIG ───────────────────────────────────────────
const PILLARS = [
  {
    key: "foundation",
    number: "01",
    label: "Foundation",
    title: "Capital\nProtection",
    desc: "Capital is the bridge between today and the mission. Protecting it is the first win.",
    color: JK.red,
  },
  {
    key: "execution",
    number: "02",
    label: "Execution",
    title: "Entry &\nExecution",
    desc: "A setup without a plan is an impulse. Execute with structure, every single time.",
    color: JK.gold,
  },
  {
    key: "profits",
    number: "03",
    label: "Profits",
    title: "Extraction &\nProtection",
    desc: "Profit becomes real only when it leaves the battlefield.",
    color: JK.green,
  },
  {
    key: "killswitch",
    number: "04",
    label: "Kill Switches",
    title: "Emergency\nProtocol",
    desc: "These rules exist for the moment emotion grabs the keyboard.",
    color: JK.redSoft,
  },
  {
    key: "ritual",
    number: "05",
    label: "Daily Ritual",
    title: "Structure &\nDiscipline",
    desc: "Structure comes before action. Always.",
    color: JK.gold2,
  },
];

// ─── RULES DATA ──────────────────────────────────────────────
const RULES = [
  // ── FOUNDATION ──
  {
    id: "R-01", pillar: "foundation", tier: "primary", fatal: true,
    title: "Ledger Split — Absolute Kill Switch",
    tag: "non-negotiable",
    body: <>
      Reserve capital stays on a <strong style={{color:JK.white}}>Ledger entrusted to the team</strong>, retrievable only outside trading sessions.
      Operational liquidity stays on a separate wallet.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Zero reload during the session. Zero exceptions. Ever.</span>
    </>,
  },
  {
    id: "R-02", pillar: "foundation", tier: "primary", fatal: true,
    title: "Max 10–25% Position Size",
    tag: "sizing",
    body: <>
      Position size must stay between <strong style={{color:JK.white}}>10% and 25% of the trading wallet</strong> depending on conviction and liquidity.
      Even inside that range, the <strong style={{color:JK.white}}>maximum risk is 5% of the total bankroll</strong> on any single trade.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Size and risk are not the same thing. Both must be controlled.</span>
    </>,
  },
  {
    id: "R-03", pillar: "foundation", tier: "secondary",
    title: "Define the Risk Before Staying In",
    tag: "mandatory",
    body: <>
      Every trade must quickly move into a clear framework: <strong style={{color:JK.white}}>risk amount, stop loss, and target.</strong><br/>
      Use the risk management tool every single time.<br/>
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>No position stays open without a defined risk framework.</span>
    </>,
  },
  {
    id: "R-04", pillar: "foundation", tier: "secondary",
    title: "Never Move Your Stop Against the Trade",
    tag: "discipline",
    body: <>
      Once placed, your stop-loss is sacred. Moving it further away because "price needs room" is pure rationalization.
      You defined your invalidation point before entry — respect it.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Moving stops is how small losses become catastrophic ones.</span>
    </>,
  },

  // ── EXECUTION ──
  {
    id: "R-05", pillar: "execution", tier: "primary",
    title: "One Sentence Thesis Before Entry",
    tag: "clarity",
    body: <>
      Ideally, write <strong style={{color:JK.white}}>one sentence explaining the trade before entry.</strong><br/>
      If speed makes that impossible, you may enter first — then write the sentence immediately after and decide whether the position still deserves to stay open.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>If the thesis is weak after entry, you exit.</span>
    </>,
  },
  {
    id: "R-06", pillar: "execution", tier: "primary",
    title: "Minimum 2:1 Risk / Reward",
    tag: "r:r filter",
    body: <>
      Only take setups where the potential reward is <strong style={{color:JK.white}}>at least twice the risk.</strong><br/>
      Even with a 40% win rate, a 2:1 R:R keeps you profitable over time.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Skip the setups that don't pass this filter — there will always be another one.</span>
    </>,
  },
  {
    id: "R-07", pillar: "execution", tier: "secondary",
    title: "Confirm the Trend Before Entry",
    tag: "structure",
    body: <>
      On your chosen timeframe, confirm that price is making <strong style={{color:JK.white}}>higher highs / higher lows</strong> (uptrend) or lower highs / lower lows (downtrend) before going in.
      Counter-trend trades require elite execution — avoid them.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Never fight the dominant structure.</span>
    </>,
  },
  {
    id: "R-08", pillar: "execution", tier: "secondary",
    title: "Wait for the Retest",
    tag: "patience",
    body: <>
      Don't chase breakouts. Wait for price to break a key level, pull back, retest it, and show rejection.
      This gives you a tighter stop, better R:R, and confirmation that the level is holding.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>FOMO entries are how accounts get chopped.</span>
    </>,
  },
  {
    id: "R-09", pillar: "execution", tier: "secondary",
    title: "Higher Timeframe Confluence = Higher Conviction",
    tag: "confluence",
    body: <>
      The best entries happen when your trigger (e.g. 15m) aligns with structure on the <strong style={{color:JK.white}}>higher timeframe (4H or Daily).</strong><br/>
      When a Daily support zone lines up with a 15m bullish engulfing, that's a confluence setup.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Size up slightly and trust it.</span>
    </>,
  },
  {
    id: "R-10", pillar: "execution", tier: "secondary",
    title: "Max 1–3 Trades Per Session",
    tag: "focus",
    body: <>
      Cap yourself at <strong style={{color:JK.white}}>3 concurrent trades maximum.</strong> If you're in 3 and see a new setup, either skip it or close one first.
      Spreading across too many positions dilutes your focus and multiplies correlated risk.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Patience is a position.</span>
    </>,
  },

  // ── PROFITS ──
  {
    id: "R-11", pillar: "profits", tier: "primary",
    title: "Move Profits Out Immediately",
    tag: "extraction",
    body: <>
      As soon as a trade is in profit, <strong style={{color:JK.white}}>send gains to a separate profit wallet.</strong><br/>
      Allocation: LP reserve + growth capital + moonbag wallet.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>What leaves the trading wallet does not return during the session.</span>
    </>,
  },
  {
    id: "R-12", pillar: "profits", tier: "primary",
    title: "Partial Exit at 1:1 — Let Runners Run",
    tag: "exit strategy",
    body: <>
      When price hits your first target at 1:1, take <strong style={{color:JK.white}}>50% off the table.</strong> Move your stop to break-even on the remaining position.
      This guarantees a worst-case scratch on the trade, while leaving room to capture a larger move.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Guarantee the floor. Hunt the ceiling.</span>
    </>,
  },
  // ── FOUNDATION secondary additions ──
  {
    id: "R-04b", pillar: "foundation", tier: "secondary",
    title: "Weekly Capital Audit",
    tag: "accountability",
    body: <>
      Every week, before the first session, do a full audit: <strong style={{color:JK.white}}>total capital, open positions, profit wallet balance.</strong><br/>
      You cannot protect what you don't measure. Numbers don't lie — feelings do.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Know exactly where you stand before you touch anything.</span>
    </>,
  },
  {
    id: "R-04c", pillar: "foundation", tier: "secondary",
    title: "Never Trade With Borrowed Capital",
    tag: "integrity",
    body: <>
      Leverage on borrowed money — loans, credit, others' funds without formal structure — is <strong style={{color:JK.white}}>strictly forbidden.</strong><br/>
      When capital has emotional weight beyond the trade, objectivity collapses.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Only deploy what you can afford to lose completely. That is the only free capital.</span>
    </>,
  },
  {
    id: "R-04d", pillar: "foundation", tier: "secondary",
    title: "Correlated Positions Count as One",
    tag: "risk concentration",
    body: <>
      Two positions in the same sector, same narrative, or same on-chain ecosystem are <strong style={{color:JK.white}}>treated as a single position</strong> for sizing purposes.<br/>
      Correlation is invisible leverage. It multiplies loss in silence.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Diversification across correlated assets is an illusion.</span>
    </>,
  },

  // ── EXECUTION secondary additions ──
  {
    id: "R-10b", pillar: "execution", tier: "secondary",
    title: "No Entry in the First 15 Minutes",
    tag: "timing",
    body: <>
      The opening of any major session is a <strong style={{color:JK.white}}>liquidity trap.</strong> Market makers hunt stops, spread widens, and noise dominates signal.<br/>
      Wait for the dust to settle. Let the opening range form before committing.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>The best setups are rarely the first ones of the day.</span>
    </>,
  },
  {
    id: "R-10c", pillar: "execution", tier: "secondary",
    title: "Volume Must Confirm the Move",
    tag: "confirmation",
    body: <>
      A breakout or breakdown without volume is a <strong style={{color:JK.white}}>fake move until proven otherwise.</strong><br/>
      Always check volume relative to the last 10 candles before committing to a momentum entry.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Price moves. Volume reveals intent.</span>
    </>,
  },
  {
    id: "R-10d", pillar: "execution", tier: "secondary",
    title: "Avoid Entries Before Major News",
    tag: "event risk",
    body: <>
      Do not enter new positions within <strong style={{color:JK.white}}>30 minutes of a scheduled macro event</strong> (CPI, FOMC, major earnings).<br/>
      You are not trading the market — you are gambling on a coin flip with artificial volatility.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>The Kabal does not gamble. It hunts edge.</span>
    </>,
  },
  {
    id: "R-10e", pillar: "execution", tier: "secondary",
    title: "One Setup Type Per Session",
    tag: "focus",
    body: <>
      Choose your setup archetype before the session opens — <strong style={{color:JK.white}}>retest, breakout, or reversal</strong> — and only execute that type.<br/>
      Mixing setups mid-session means you are reacting, not executing.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Mastery comes from repetition. Repetition requires focus.</span>
    </>,
  },

  // ── PROFITS secondary additions ──
  {
    id: "R-13", pillar: "profits", tier: "secondary",
    title: "No Re-Entry on a Winning Coin",
    tag: "moonbag",
    body: <>
      After taking profit on a coin, it is <strong style={{color:JK.white}}>forbidden to re-enter with base capital.</strong><br/>
      Re-entry is allowed only with moonbag profits, <strong style={{color:JK.white}}>maximum 50% of the gains.</strong>
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>The other 50% always stays secured.</span>
    </>,
  },
  {
    id: "R-14", pillar: "profits", tier: "secondary",
    title: "Don't Close Early Out of Fear",
    tag: "conviction",
    body: <>
      If your setup is valid and your stop hasn't been hit, <strong style={{color:JK.white}}>do not close manually</strong> because the trade is "uncomfortable".
      Discomfort is part of trading. Exiting early consistently destroys your R:R.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Train yourself to trust the plan, not the feeling.</span>
    </>,
  },

  {
    id: "R-14b", pillar: "profits", tier: "secondary",
    title: "Allocate Every Profit Before Next Session",
    tag: "allocation",
    body: <>
      Before opening a new session, <strong style={{color:JK.white}}>every unallocated profit must be distributed</strong> across wallets: LP reserve, growth capital, moonbag, personal draw.<br/>
      Leaving profits in the trading wallet invites unconscious oversizing.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>An organized war chest is a winning war chest.</span>
    </>,
  },
  {
    id: "R-14c", pillar: "profits", tier: "secondary",
    title: "Never Reinvest More Than 50% of a Single Win",
    tag: "compounding discipline",
    body: <>
      When a trade closes in significant profit, <strong style={{color:JK.white}}>a maximum of 50% of those gains</strong> may re-enter the trading wallet for the next session.<br/>
      The other half is locked. Compounding is a long game — protect the base.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>You compound the wins. You don't gamble them back.</span>
    </>,
  },
  {
    id: "R-14d", pillar: "profits", tier: "secondary",
    title: "Track ROI Weekly, Not Daily",
    tag: "perspective",
    body: <>
      Daily P&L creates emotional noise. <strong style={{color:JK.white}}>Measure performance on a weekly basis</strong> to see the real trend beneath the variance.<br/>
      A red day inside a green week is a data point, not a disaster.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Zoom out. The edge reveals itself over time, not over sessions.</span>
    </>,
  },

  // ── KILL SWITCHES ──
  {
    id: "R-15", pillar: "killswitch", tier: "primary", fatal: true,
    title: "Conviction Stop Loss = Full Exit",
    tag: "tilt protection",
    body: <>
      If a conviction play gets stopped out:<br/>
      → <strong style={{color:JK.white}}>Full exit or maximum 5% exposure</strong><br/>
      → <strong style={{color:JK.white}}>Zero size re-entry for at least 2 hours</strong><br/>
      <span style={{color:JK.redSoft,fontStyle:"italic",display:"block",marginTop:8}}>Mandatory 30-minute pause before any new trade.</span>
    </>,
  },
  {
    id: "R-16", pillar: "killswitch", tier: "primary", fatal: true,
    title: "Zero Double Down to Recover",
    tag: "immediate stop",
    body: <>
      Increasing size to recover a loss means <strong style={{color:JK.white}}>immediate end of the session.</strong>
      <span style={{color:JK.redSoft,fontStyle:"italic",display:"block",marginTop:8}}>Being right and making money are two different games. The market owes validation to no one.</span>
    </>,
  },
  {
    id: "R-17", pillar: "killswitch", tier: "secondary", fatal: true,
    title: "Daily Loss Limit: −3R Hard Stop",
    tag: "daily limit",
    body: <>
      If you're down <strong style={{color:JK.white}}>3R in a single day</strong>, close everything and step away. No exceptions.
      Bad days cascade — the urge to revenge-trade after 3 losses is the single most reliable way to turn a bad day into an account wipe.
      <span style={{color:JK.redSoft,fontStyle:"italic",display:"block",marginTop:8}}>The market will be there tomorrow.</span>
    </>,
  },
  {
    id: "R-18", pillar: "killswitch", tier: "secondary",
    title: "Verify Before Any Re-Entry",
    tag: "check-in",
    body: <>
      If there is an impulse to re-enter with size, <strong style={{color:JK.white}}>look at the day's numbers.</strong><br/>
      Green → you already won. Red → you already lost enough.
      <span style={{color:JK.redSoft,fontStyle:"italic",display:"block",marginTop:8}}>In both cases, the answer is no.</span>
    </>,
  },

  {
    id: "R-18b", pillar: "killswitch", tier: "secondary",
    title: "Social Media Off During Session",
    tag: "signal purity",
    body: <>
      Close Twitter, Telegram, Discord during active trading. <strong style={{color:JK.white}}>External noise corrupts internal signal.</strong><br/>
      Someone else's conviction about a coin is not your setup. Their urgency is not your edge.
      <span style={{color:JK.redSoft,fontStyle:"italic",display:"block",marginTop:8}}>The Kabal trades what it sees, not what it hears.</span>
    </>,
  },
  {
    id: "R-18c", pillar: "killswitch", tier: "secondary",
    title: "Three Consecutive Losses = Mandatory Pause",
    tag: "pattern break",
    body: <>
      Three losses in a row — regardless of size — trigger a <strong style={{color:JK.white}}>mandatory 1-hour pause.</strong><br/>
      Not because the market is wrong. Because your read of it may be off, and continuing compounds the misalignment.
      <span style={{color:JK.redSoft,fontStyle:"italic",display:"block",marginTop:8}}>Step back. Reset. Return with fresh eyes.</span>
    </>,
  },
  {
    id: "R-18d", pillar: "killswitch", tier: "secondary",
    title: "Never Trade Sick, Exhausted, or Emotionally Charged",
    tag: "physical state",
    body: <>
      Trading is a cognitive performance sport. <strong style={{color:JK.white}}>Physical and emotional state directly degrades decision quality.</strong><br/>
      If you slept less than 5 hours, received bad news, or are in conflict with someone — the session does not open.
      <span style={{color:JK.redSoft,fontStyle:"italic",display:"block",marginTop:8}}>A rested mind is an unfair advantage. Use it.</span>
    </>,
  },

  // ── RITUAL ──
  {
    id: "R-19", pillar: "ritual", tier: "primary",
    title: "Log Every Trade — No Exceptions",
    tag: "journal",
    body: <>
      Track entry, exit, setup type, <strong style={{color:JK.white}}>emotional state, and result.</strong> Without data on your own behavior, you can't improve.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Most traders repeat the same mistake 200 times because they never wrote it down.</span>
    </>,
  },
  {
    id: "R-20", pillar: "ritual", tier: "primary",
    title: "Trade the Setup, Not the Story",
    tag: "objectivity",
    body: <>
      Narratives are dangerous. "This coin is going 100x" is a story. <strong style={{color:JK.white}}>Trade what price actually does</strong> — structure, levels, and momentum.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>The moment you're in love with a thesis, you stop seeing what's in front of you.</span>
    </>,
  },
  {
    id: "R-21", pillar: "ritual", tier: "secondary",
    title: "Don't Trade After a Big Win",
    tag: "overconfidence",
    body: <>
      A large win triggers overconfidence. You feel invincible, you loosen your rules, you size up.
      <strong style={{color:JK.white}}> After a +5R day, reduce size by 50%</strong> for the next session minimum.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>This is the market's favorite moment to take it back.</span>
    </>,
  },
  {
    id: "R-22", pillar: "ritual", tier: "secondary",
    title: "Respect the Session — Know When Not to Trade",
    tag: "timing",
    body: <>
      Low-volume sessions produce choppy, unpredictable price action.
      Know your market's <strong style={{color:JK.white}}>high-liquidity windows</strong> and only trade during them.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Idle markets are not opportunities — they're traps.</span>
    </>,
  },
  {
    id: "R-22b", pillar: "ritual", tier: "secondary",
    title: "Monthly Rules Review — Alone",
    tag: "self-audit",
    body: <>
      Once a month, sit alone with the Trading Code and your journal. <strong style={{color:JK.white}}>Score yourself honestly on every rule.</strong><br/>
      Which ones did you break? Which ones saved you? Update what needs updating. Delete what no longer serves.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Rules that are never reviewed become wallpaper.</span>
    </>,
  },
  {
    id: "R-22c", pillar: "ritual", tier: "secondary",
    title: "The Ledger Is Reviewed by the Team Weekly",
    tag: "accountability",
    body: <>
      Every week, <strong style={{color:JK.white}}>share the trade journal with at least one Kabal member.</strong><br/>
      Accountability is not weakness — it is architecture. You cannot audit yourself in the same state you traded in.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>The Kabal holds the mirror. You do the looking.</span>
    </>,
  },
  {
    id: "R-22d", pillar: "ritual", tier: "secondary",
    title: "Visualize the Trade Before the Market Opens",
    tag: "preparation",
    body: <>
      Before the session, spend <strong style={{color:JK.white}}>5 minutes mentally walking through your ideal execution:</strong> the setup forming, the entry, the management, the exit.<br/>
      The brain that has rehearsed the play executes it faster and cleaner under pressure.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Champions rehearse. Amateurs react.</span>
    </>,
  },
  {
    id: "R-22e", pillar: "ritual", tier: "secondary",
    title: "One Learning Per Session — No More",
    tag: "growth",
    body: <>
      After closing, identify <strong style={{color:JK.white}}>exactly one thing to improve</strong> for the next session. Not five. Not a list. One.<br/>
      Improvement is a precision tool, not a flood. Trying to fix everything fixes nothing.
      <span style={{color:JK.gold2,fontStyle:"italic",display:"block",marginTop:8}}>Master one variable at a time. That is how edges are built.</span>
    </>,
  },
];

// ─── RITUAL DATA ─────────────────────────────────────────────
const RITUAL_BLOCKS = [
  {
    time: "Before the session", title: "Opening",
    steps: [
      "Meditation or visualization — minimum 5 minutes",
      "Read the Trading Code — choose who trades today",
      "Repeat the credo — anchor the identity",
      "Hand the Ledger to the team",
      "Zero messages before the session — the battlefield must stay clean",
    ],
  },
  {
    time: "During the session", title: "Execution",
    steps: [
      "One-sentence thesis before entry, or immediately after if speed demands it",
      "Risk defined — stop loss placed — target set",
      "Immediate profit extraction",
      "The team validates rule compliance",
      "Maximum 1 to 3 trades per session",
    ],
  },
  {
    time: "If tilt arrives", title: "Emergency Protocol",
    steps: [
      "Look at the day's numbers",
      "Call the safeguard team",
      "Zero reload — the Ledger stays with the team",
      "Close the laptop. No exceptions.",
    ],
    critical: true,
  },
  {
    time: "After the session", title: "Closing",
    steps: [
      "Trade journal — result + emotional state",
      "Distribute profits across separate wallets",
      "How many rules were respected today?",
      "Take back the Ledger — session complete",
    ],
  },
];

// ─── COMPONENTS ──────────────────────────────────────────────

function Divider() {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(90deg, transparent, ${JK.border2}, transparent)`,
      margin: "28px 0",
    }} />
  );
}

function Tag({ children, variant = "default" }) {
  const styles = {
    default: { color: JK.gold,    bg: "rgba(212,154,42,0.07)",  border: "rgba(212,154,42,0.28)" },
    red:     { color: JK.redSoft, bg: "rgba(227,74,50,0.07)",   border: "rgba(227,74,50,0.28)" },
    green:   { color: JK.green,   bg: "rgba(40,217,111,0.07)",  border: "rgba(40,217,111,0.28)" },
    fatal:   { color: JK.redSoft, bg: "rgba(227,74,50,0.10)",   border: "rgba(227,74,50,0.40)" },
  };
  const s = styles[variant] || styles.default;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 12px", borderRadius: 999,
      border: `1px solid ${s.border}`,
      background: s.bg, color: s.color,
      fontFamily: "'Cinzel', serif",
      fontSize: 9, letterSpacing: "0.2em",
      textTransform: "uppercase", fontWeight: 600,
    }}>
      {children}
    </span>
  );
}

function RuleCard({ rule, pillarColor }) {
  const [open, setOpen] = useState(false);
  const isPrimary = rule.tier === "primary";
  const isKill = rule.pillar === "killswitch";
  const accentColor = rule.fatal ? JK.red : (isPrimary ? pillarColor : JK.goldDim);

  return (
    <div style={{
      background: JK.card,
      border: `1px solid ${rule.fatal ? "rgba(227,74,50,0.25)" : JK.border}`,
      borderRadius: 20,
      overflow: "hidden",
      position: "relative",
      marginBottom: isPrimary ? 12 : 8,
      opacity: isPrimary ? 1 : 0.9,
    }}>
      {/* Top shimmer */}
      <div style={{
        position:"absolute",top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${accentColor}66,transparent)`,
      }}/>
      {/* Left accent */}
      <div style={{
        position:"absolute",left:0,top:0,bottom:0,width:3,
        background: accentColor, opacity: isPrimary ? 0.8 : 0.35,
      }}/>

      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "18px 20px 18px 24px",
          display: "flex", alignItems: "center", gap: 14,
          cursor: "pointer",
          background: open ? "rgba(212,154,42,0.03)" : "transparent",
          userSelect: "none",
        }}
      >
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 10, fontWeight: 600,
          color: accentColor, minWidth: 36,
          letterSpacing: "0.15em", opacity: 0.9,
        }}>
          {rule.id}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 13, fontWeight: 600,
              color: rule.fatal ? JK.redSoft : (isPrimary ? JK.white : JK.muted),
              letterSpacing: "0.04em",
            }}>
              {rule.title}
            </span>
            {rule.fatal && <Tag variant="fatal">☠ Fatal</Tag>}
            {!rule.fatal && isPrimary && <Tag variant={isKill ? "red" : "default"}>Core</Tag>}
          </div>
        </div>

        <span style={{
          color: JK.gold, fontSize: 9, opacity: 0.6,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
        }}>▼</span>
      </div>

      {/* Body */}
      {open && (
        <div style={{
          padding: "0 24px 20px 24px",
          borderTop: `1px solid rgba(212,154,42,0.07)`,
          paddingTop: 16,
        }}>
          <div style={{ fontSize: 14, color: JK.muted, lineHeight: 1.85, marginBottom: 14 }}>
            {rule.body}
          </div>
          <Tag variant={rule.fatal ? "fatal" : (isKill ? "red" : "default")}>{rule.tag}</Tag>
        </div>
      )}
    </div>
  );
}

function PillarSection({ pillar, rules }) {
  const primary = rules.filter(r => r.tier === "primary");
  const secondary = rules.filter(r => r.tier === "secondary");
  const [showSecondary, setShowSecondary] = useState(false);
  const isRitual = pillar.key === "ritual";

  return (
    <div style={{ marginBottom: 56 }}>
      {/* Pillar Header */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${JK.border}` }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 10, letterSpacing: "0.4em",
          color: pillar.color, opacity: 0.85,
          textTransform: "uppercase", marginBottom: 10,
        }}>
          {pillar.number} — {pillar.label}
        </div>
        <h2 style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "clamp(28px, 4vw, 44px)",
          lineHeight: 1, letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: JK.white, marginBottom: 10,
          whiteSpace: "pre-line",
        }}>
          {pillar.title}
        </h2>
        <p style={{ fontSize: 14, color: JK.mutedDim, lineHeight: 1.7, maxWidth: 560 }}>
          {pillar.desc}
        </p>
      </div>

      {/* Ritual blocks special rendering */}
      {isRitual && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14, marginBottom: 20,
        }}>
          {RITUAL_BLOCKS.map((block, i) => (
            <div key={i} style={{
              background: JK.card,
              border: `1px solid ${block.critical ? "rgba(227,74,50,0.22)" : JK.border}`,
              borderRadius: 20, padding: "22px 22px 20px",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position:"absolute",top:0,left:0,right:0,height:1,
                background:`linear-gradient(90deg,transparent,${block.critical ? JK.red : JK.gold}55,transparent)`,
              }}/>
              <div style={{
                fontFamily:"'Cinzel',serif", fontSize:9,
                letterSpacing:"0.3em", textTransform:"uppercase",
                color: block.critical ? JK.redSoft : JK.gold,
                marginBottom:10, opacity:0.85,
              }}>
                {block.time}
              </div>
              <div style={{
                fontFamily:"'Cinzel',serif", fontSize:18,
                letterSpacing:"0.07em", textTransform:"uppercase",
                color: JK.white, marginBottom:16,
              }}>
                {block.title}
              </div>
              <ul style={{ listStyle:"none", display:"grid", gap:8 }}>
                {block.steps.map((step, j) => (
                  <li key={j} style={{
                    display:"flex", gap:10, alignItems:"flex-start",
                    color: JK.muted, fontSize:13, lineHeight:1.6,
                    paddingTop: j > 0 ? 8 : 0,
                    borderTop: j > 0 ? `1px solid rgba(212,154,42,0.08)` : "none",
                  }}>
                    <span style={{
                      flexShrink:0, width:24, height:24, borderRadius:999,
                      border:`1px solid ${block.critical ? "rgba(227,74,50,0.3)" : "rgba(212,154,42,0.22)"}`,
                      display:"inline-flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"'Cinzel',serif", fontSize:10,
                      color: block.critical ? JK.redSoft : JK.gold,
                      marginTop:1,
                    }}>
                      {String(j+1).padStart(2,"0")}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Primary rules */}
      {primary.length > 0 && (
        <div style={{ marginBottom: secondary.length > 0 ? 16 : 0 }}>
          <div style={{
            fontSize: 10, fontFamily:"'Cinzel',serif",
            letterSpacing:"0.3em", color: JK.mutedDim,
            textTransform:"uppercase", marginBottom:12,
          }}>
            Core Rules
          </div>
          {primary.map(r => (
            <RuleCard key={r.id} rule={r} pillarColor={pillar.color} />
          ))}
        </div>
      )}

      {/* Secondary rules toggle */}
      {secondary.length > 0 && (
        <div>
          <button
            onClick={() => setShowSecondary(!showSecondary)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: showSecondary ? "rgba(212,154,42,0.06)" : "transparent",
              border: `1px solid ${showSecondary ? JK.border2 : JK.border}`,
              borderRadius: 10, padding: "10px 16px",
              cursor:"pointer", marginBottom: showSecondary ? 12 : 0,
              fontFamily:"'Cinzel',serif", fontSize:10,
              letterSpacing:"0.3em", textTransform:"uppercase",
              color: showSecondary ? JK.gold : JK.mutedDim,
              transition:"all 0.15s", width:"100%",
            }}
          >
            <span style={{
              transform: showSecondary ? "rotate(180deg)" : "none",
              transition:"transform 0.2s", display:"inline-block",
              color:JK.gold, fontSize:8,
            }}>▼</span>
            {showSecondary ? "Hide" : "Show"} {secondary.length} secondary rule{secondary.length > 1 ? "s" : ""}
          </button>

          {showSecondary && secondary.map(r => (
            <RuleCard key={r.id} rule={r} pillarColor={pillar.color} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────

export default function KabalMasterRules() {
  const [activeFilter, setActiveFilter] = useState("all");

  const fatalCount = RULES.filter(r => r.fatal).length;
  const primaryCount = RULES.filter(r => r.tier === "primary").length;

  const filters = [
    { key: "all",        label: "All Pillars" },
    { key: "foundation", label: "⚔️ Foundation" },
    { key: "execution",  label: "🎯 Execution" },
    { key: "profits",    label: "💰 Profits" },
    { key: "killswitch", label: "🔴 Kill Switches" },
    { key: "ritual",     label: "🧠 Ritual" },
  ];

  const visiblePillars = activeFilter === "all"
    ? PILLARS
    : PILLARS.filter(p => p.key === activeFilter);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
          background: linear-gradient(180deg, #060606 0%, #030303 100%);
          color: #f3ede4;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #060606; }
        ::-webkit-scrollbar-thumb { background: rgba(212,154,42,0.3); border-radius: 4px; }
      `}</style>

      {/* Ambient glow */}
      <div style={{
        position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        background:"radial-gradient(circle at 50% 0%, rgba(120,68,8,0.14), transparent 40%)",
      }}/>

      {/* Header */}
      <div style={{
        position:"relative", zIndex:1,
        textAlign:"center", padding:"52px 24px 36px",
      }}>
        <div style={{
          fontFamily:"'Cinzel',serif", fontSize:9,
          letterSpacing:"0.5em", color:JK.gold,
          textTransform:"uppercase", marginBottom:14, opacity:0.85,
        }}>
          Jungle Kabal · Private Syndicate
        </div>
        <h1 style={{
          fontFamily:"'Cinzel',serif",
          fontSize:"clamp(28px,5vw,52px)",
          letterSpacing:"0.1em", lineHeight:1.1,
          textTransform:"uppercase",
          color:JK.white, marginBottom:8,
        }}>
          Master <span style={{color:JK.gold}}>Trading Code</span>
        </h1>
        <p style={{
          fontFamily:"'Cinzel',serif",
          fontSize:11, letterSpacing:"0.2em",
          color:JK.mutedDim, marginBottom:32,
          textTransform:"uppercase",
        }}>
          5 pillars · {RULES.length} rules · {fatalCount} fatal · {RULES.filter(r=>r.tier==="secondary").length} secondary
        </p>

        {/* Stats row */}
        <div style={{
          display:"inline-grid",
          gridTemplateColumns:"repeat(4,1fr)",
          gap:10, maxWidth:520, width:"100%",
          marginBottom:32,
        }}>
          {[
            { v: PILLARS.length,  l: "Pillars",      c: JK.gold },
            { v: RULES.length,    l: "Total Rules",   c: JK.gold },
            { v: primaryCount,    l: "Core Rules",    c: JK.gold2 },
            { v: fatalCount,      l: "Fatal Rules",   c: JK.red },
          ].map((s,i) => (
            <div key={i} style={{
              background:"rgba(212,154,42,0.06)",
              border:`1px solid ${JK.border2}`,
              borderRadius:14, padding:"16px 8px",
              textAlign:"center",
            }}>
              <div style={{
                fontFamily:"'Cinzel',serif",
                fontSize:22, fontWeight:700,
                color:s.c, lineHeight:1, marginBottom:5,
              }}>{s.v}</div>
              <div style={{ fontSize:10, color:JK.mutedDim, letterSpacing:"0.1em" }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Fatal warning banner */}
        <div style={{
          maxWidth:680, margin:"0 auto 32px",
          background:"rgba(227,74,50,0.06)",
          border:"1px solid rgba(227,74,50,0.25)",
          borderRadius:14, padding:"14px 20px",
          display:"flex", alignItems:"flex-start", gap:12, textAlign:"left",
        }}>
          <span style={{fontSize:18, lineHeight:1, flexShrink:0}}>☠</span>
          <div>
            <div style={{
              fontFamily:"'Cinzel',serif", fontSize:10,
              letterSpacing:"0.3em", textTransform:"uppercase",
              color:JK.redSoft, marginBottom:5,
            }}>
              Fatal Rules — Zero Tolerance
            </div>
            <p style={{fontSize:13, color:JK.mutedDim, lineHeight:1.75}}>
              Rules marked <strong style={{color:JK.redSoft}}>☠ Fatal</strong> are non-negotiable hard limits.
              Breaking them even once can wipe days or weeks of work. They are not guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        position:"relative", zIndex:1,
        maxWidth:820, margin:"0 auto",
        padding:"0 24px 100px",
      }}>

        {/* Filter tabs */}
        <div style={{
          display:"flex", gap:8, flexWrap:"wrap",
          marginBottom:40,
        }}>
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              style={{
                background: activeFilter === f.key ? "rgba(212,154,42,0.12)" : "rgba(18,13,8,0.8)",
                border: `1px solid ${activeFilter === f.key ? JK.border2 : JK.border}`,
                borderRadius:8, padding:"9px 18px",
                fontFamily:"'Cinzel',serif", fontSize:10,
                letterSpacing:"0.25em", textTransform:"uppercase",
                color: activeFilter === f.key ? JK.gold : JK.mutedDim,
                cursor:"pointer", transition:"all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Pillar sections */}
        {visiblePillars.map(pillar => (
          <PillarSection
            key={pillar.key}
            pillar={pillar}
            rules={RULES.filter(r => r.pillar === pillar.key)}
          />
        ))}

        <Divider />

        {/* Credo */}
        <div style={{ textAlign:"center", padding:"40px 0 20px" }}>
          <div style={{
            fontFamily:"'Cinzel',serif", fontSize:10,
            letterSpacing:"0.4em", textTransform:"uppercase",
            color:JK.gold, opacity:0.7, marginBottom:20,
          }}>
            The Kabal Credo
          </div>
          <div style={{
            fontFamily:"'Cinzel',serif",
            fontSize:"clamp(30px,5vw,56px)",
            letterSpacing:"0.08em", textTransform:"uppercase",
            color:JK.gold, lineHeight:1, marginBottom:22,
          }}>
            I Am The Channel.<br/>Not The Noise.
          </div>
          <p style={{
            maxWidth:580, margin:"0 auto",
            fontSize:"clamp(15px,2vw,19px)",
            color:"rgba(243,237,228,0.6)",
            lineHeight:1.7, fontStyle:"italic",
          }}>
            We do not trade to prove that we are right.<br/>
            We trade so that <em style={{color:"rgba(212,154,42,0.85)",fontStyle:"normal"}}>abundance can serve life.</em><br/>
            Every clean trade feeds the Kabal.<br/>
            Every respected rule builds the empire.
          </p>
          <div style={{
            width:1, height:52, margin:"32px auto 0",
            background:`linear-gradient(to bottom, ${JK.gold}88, transparent)`,
          }}/>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position:"relative", zIndex:1,
        borderTop:`1px solid ${JK.border}`,
        padding:"22px 24px 36px",
        display:"flex", flexWrap:"wrap", gap:14,
        justifyContent:"center", textAlign:"center",
      }}>
        {["Jungle Kabal", `${PILLARS.length} pillars · ${RULES.length} rules`, "Structure is our freedom"].map((t,i) => (
          <span key={i} style={{
            fontFamily:"'Cinzel',serif", fontSize:10,
            letterSpacing:"0.28em", textTransform:"uppercase",
            color: i === 0 ? JK.gold : JK.mutedDim,
          }}>{t}</span>
        ))}
      </div>
    </>
  );
}
