import { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'

// ─── DIALOGUES ───────────────────────────────────────────────────────────────

const DIALOGUES = {
  intro: [
    "Tu oses defier le Kabal ? T'as du culot, rookie.",
    "Bienvenue dans la jungle. Ici on joue pour de vrai.",
    "Les esprits de la foret ont parie contre toi. GG.",
    "Je t'avertis -- je connais ces des mieux que ma propre main.",
  ],
  aiGoodRoll: [
    "SIX. Les dieux des des m'appartiennent.",
    "Encore un beau lance pour le Kabal. Classique.",
    "Cinq ! La jungle parle.",
    "Tu as vu ca ? Magnifique.",
  ],
  aiBadRoll: [
    "Un... c'est strategique. Vraiment.",
    "Deux. Je fais expres evidemment.",
    "Peu importe, je te bats quand meme.",
    "Les des mentent parfois. Moi jamais.",
  ],
  aiCancelsPlayer: [
    "Oops. J'ai efface ta colonne ? Desole... pas vraiment.",
    "Cancel ! C'est la methode Kabal.",
    "T'as construit tout ca pour rien. Cruel, non ?",
    "Boom. On appelle ca une purge.",
  ],
  playerCancelsAI: [
    "HEY. C'etait MA colonne !",
    "Coup sournois. Je respecte... mais je vais me venger.",
    "Tu joues sale. On est pareils finalement.",
    "Interessant. La partie devient serieuse.",
  ],
  aiWinning: [
    "C'estenant pour toi la...",
    "Le Kabal ne perd pas. C'est juste un fait.",
    "Mon score fait mal, non ?",
    "T'as besoin d'aide ? Non, trop tard.",
  ],
  playerWinning: [
    "Ok, je t'ai peut-etre sous-estime.",
    "Chance de debutant. Profite.",
    "Les bons coups ne font pas les legendes.",
    "Hmm. T'es meilleur que t'en as l'air.",
  ],
  aiWins: [
    "Le Kabal regne. Comme toujours.",
    "GG no re. Reviens quand tu seras pret.",
    "Checkmate. Ah non, mauvais jeu. Je gagne quand meme.",
    "La jungle t'a rejete. Dommage.",
    "Voila ce qui arrive quand on defie le Kabal.",
  ],
  playerWins: [
    "Impossible... la jungle m'a trahi.",
    "T'as eu de la chance. Revanche. MAINTENANT.",
    "...Bien joue. T'es officiellement Kabal-worthy.",
    "Je rejoue dans 3, 2, 1... clique sur Revanche.",
    "Ok ok ok. Une fois. Une seule fois.",
  ],
  columnFull: [
    "Cette colonne est pleine, genie.",
    "Tu vois les des la ? Elle est pleine.",
    "Essaie une autre colonne peut-etre ?",
  ],
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── GAME LOGIC ──────────────────────────────────────────────────────────────

const ROWS = 3

function rollDie() {
  return Math.floor(Math.random() * 6) + 1
}

function calcColumnScore(col) {
  if (!col.length) return 0
  const counts = {}
  col.forEach(v => { counts[v] = (counts[v] || 0) + 1 })
  return Object.entries(counts).reduce((sum, [v, k]) => sum + k * k * Number(v), 0)
}

function calcTotalScore(grid) {
  return grid.reduce((sum, col) => sum + calcColumnScore(col), 0)
}

function isGridFull(grid) {
  return grid.every(col => col.length >= ROWS)
}

function placeDieInGrid(grid, colIdx, value) {
  return grid.map((col, i) => (i === colIdx ? [...col, value] : [...col]))
}

function cancelDiceInGrid(grid, colIdx, value) {
  return grid.map((col, i) =>
    i === colIdx ? col.filter(v => v !== value) : [...col]
  )
}

function getAIColumn(aiGrid, playerGrid, roll) {
  const available = [0, 1, 2].filter(i => aiGrid[i].length < ROWS)
  if (!available.length) return -1

  const scored = available.map(col => {
    const cancelCount = playerGrid[col].filter(v => v === roll).length
    const existing    = aiGrid[col].filter(v => v === roll).length
    const newCount    = existing + 1
    const scoreGain   = newCount * newCount * roll - existing * existing * roll
    const priority    = scoreGain + cancelCount * roll * 3
    return { col, priority }
  })

  scored.sort((a, b) => b.priority - a.priority)
  return scored[0].col
}

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

/** Single die cell — uses image from /dice/die-N.svg (swap with your assets) */
function DieCell({ value, isNew }) {
  const baseClass = 'w-[52px] h-[52px] rounded-lg overflow-hidden flex-shrink-0'

  if (!value) {
    return (
      <div
        className={baseClass}
        style={{
          background: 'rgba(10,8,5,0.55)',
          border: '1px dashed rgba(245,184,0,0.18)',
        }}
      />
    )
  }

  return (
    <div className={`${baseClass} ${isNew ? 'animate-bounce-in' : ''}`}>
      <img
        src={`${import.meta.env.BASE_URL}dice/die-${value}.png`}
        alt={`${value}`}
        className="w-full h-full object-contain"
        draggable={false}
        onError={e => { e.currentTarget.src = `${import.meta.env.BASE_URL}dice/die-${value}.svg` }}
      />
    </div>
  )
}

/** Column of 3 die cells — clickable when canPlace is true */
function GridColumn({ dice, colIdx, canPlace, isPlayerGrid, onPlace }) {
  // Player grid: newest die at top visually (stack upward).
  // AI grid: newest die at bottom visually (closest to player).
  const cells = Array.from({ length: ROWS }, (_, i) => {
    return isPlayerGrid ? (dice[ROWS - 1 - i] ?? null) : (dice[i] ?? null)
  })

  const isFull = dice.length >= ROWS

  return (
    <button
      onClick={canPlace && !isFull ? () => onPlace(colIdx) : undefined}
      disabled={!canPlace || isFull}
      className={[
        'flex flex-col gap-1.5 p-1.5 rounded-xl transition-all duration-200',
        canPlace && !isFull
          ? 'cursor-pointer hover:scale-105'
          : 'cursor-default',
      ].join(' ')}
      style={
        canPlace && !isFull
          ? {
              boxShadow: '0 0 0 1.5px #F5B800, 0 0 14px rgba(245,184,0,0.35)',
              background: 'rgba(245,184,0,0.06)',
            }
          : {}
      }
      aria-label={`Colonne ${colIdx + 1}`}
    >
      {cells.map((val, i) => (
        <DieCell key={i} value={val} isNew={false} />
      ))}
    </button>
  )
}

/** 3-column knucklebones grid */
function KGrid({ grid, isPlayerGrid, canPlace, onPlace }) {
  return (
    <div className="flex gap-2">
      {grid.map((dice, colIdx) => (
        <GridColumn
          key={colIdx}
          dice={dice}
          colIdx={colIdx}
          canPlace={canPlace}
          isPlayerGrid={isPlayerGrid}
          onPlace={onPlace}
        />
      ))}
    </div>
  )
}

/** Score column breakdown (small, below each grid) */
function ColumnScores({ grid }) {
  return (
    <div className="flex gap-2 px-1.5">
      {grid.map((col, i) => (
        <div
          key={i}
          className="w-[70px] text-center text-xs font-display tracking-wider"
          style={{ color: calcColumnScore(col) > 0 ? '#F5B800' : 'rgba(245,184,0,0.3)' }}
        >
          {calcColumnScore(col) || '-'}
        </div>
      ))}
    </div>
  )
}

/** AI dialogue area */
function AIBubble({ text, isThinking }) {
  return (
    <div className="flex items-start gap-3">
      {/* Logo icon as AI avatar */}
      <div
        className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden animate-float"
        style={{ boxShadow: '0 0 10px rgba(245,184,0,0.4)' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}logo-icon.png`}
          alt="Jungle Kabal"
          className="w-full h-full object-cover"
          onError={e => {
            // Fallback if logo-icon.png not yet placed
            e.currentTarget.style.display = 'none'
            e.currentTarget.parentElement.textContent = '👁'
            e.currentTarget.parentElement.style.cssText +=
              ';display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:rgba(245,184,0,0.15);border:1px solid rgba(245,184,0,0.3)'
          }}
        />
      </div>

      {/* Bubble */}
      <div
        className="relative rounded-xl rounded-tl-none px-3.5 py-2.5 max-w-[230px] animate-slide-up"
        style={{
          background: 'rgba(10,8,5,0.82)',
          border: '1px solid rgba(245,184,0,0.2)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div
          className="absolute -left-[7px] top-3 w-0 h-0"
          style={{
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '7px solid rgba(245,184,0,0.2)',
          }}
        />
        {isThinking ? (
          <span className="inline-flex gap-1 py-0.5">
            {[0, 150, 300].map(d => (
              <span
                key={d}
                className="w-1.5 h-1.5 rounded-full animate-bounce"
                style={{ background: '#F5B800', animationDelay: `${d}ms` }}
              />
            ))}
          </span>
        ) : (
          <p className="text-white/90 text-sm leading-snug font-body tracking-wide">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

/** The big die shown in center while rolling / after roll */
function RollDie({ value, isRolling }) {
  return (
    <div
      className={`w-24 h-24 rounded-2xl overflow-hidden ${isRolling ? 'animate-roll-in' : ''}`}
      style={{ boxShadow: value ? '0 0 20px rgba(245,184,0,0.5), 0 0 40px rgba(245,184,0,0.2)' : 'none' }}
    >
      {value ? (
        <img
          src={`${import.meta.env.BASE_URL}dice/die-${value}.png`}
          alt={`${value}`}
          className="w-full h-full object-contain"
          draggable={false}
          onError={e => { e.currentTarget.src = `${import.meta.env.BASE_URL}dice/die-${value}.svg` }}
        />
      ) : (
        <div
          className="w-full h-full rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(10,8,5,0.7)',
            border: '2px dashed rgba(245,184,0,0.25)',
          }}
        >
          <span className="font-display text-4xl" style={{ color: 'rgba(245,184,0,0.3)' }}>?</span>
        </div>
      )}
    </div>
  )
}

/** Victory / defeat overlay */
function EndScreen({ winner, playerScore, aiScore, onRestart }) {
  const win = winner === 'player'

  useEffect(() => {
    if (!win) return
    const fire = (ratio, opts) =>
      confetti({
        origin: { y: 0.55 },
        particleCount: Math.floor(250 * ratio),
        colors: ['#F5B800', '#FACC15', '#FDE68A', '#ffffff', '#4ADE80'],
        ...opts,
      })
    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2,  { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1,  { spread: 120, startVelocity: 45 })
  }, [win])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(5,4,2,0.88)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative rounded-3xl p-8 max-w-sm w-full mx-4 text-center"
        style={{
          background: 'rgba(12,9,4,0.95)',
          border: win
            ? '1.5px solid rgba(245,184,0,0.5)'
            : '1.5px solid rgba(180,40,40,0.5)',
          boxShadow: win
            ? '0 0 50px rgba(245,184,0,0.2)'
            : '0 0 50px rgba(180,40,40,0.15)',
        }}
      >
        <div className="text-6xl mb-4 animate-float">{win ? '🏆' : '💀'}</div>

        <h2
          className="font-display text-5xl tracking-widest mb-1"
          style={{
            color: win ? '#F5B800' : '#F87171',
            textShadow: win
              ? '0 0 20px rgba(245,184,0,0.6)'
              : '0 0 20px rgba(248,113,113,0.5)',
          }}
        >
          {win ? 'VICTOIRE' : 'DEFAITE'}
        </h2>

        <p className="font-body text-sm mb-6 tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {win ? 'Tu as domine la jungle.' : 'La jungle t\'a domine.'}
        </p>

        <div className="flex justify-center gap-6 mb-7">
          <div className="flex flex-col items-center">
            <span
              className="font-display text-5xl"
              style={{ color: win ? '#F5B800' : 'rgba(255,255,255,0.4)' }}
            >
              {playerScore}
            </span>
            <span className="font-body text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Toi</span>
          </div>
          <span className="font-display text-2xl self-center" style={{ color: 'rgba(255,255,255,0.2)' }}>VS</span>
          <div className="flex flex-col items-center">
            <span
              className="font-display text-5xl"
              style={{ color: !win ? '#F87171' : 'rgba(255,255,255,0.4)' }}
            >
              {aiScore}
            </span>
            <span className="font-body text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Jaguar</span>
          </div>
        </div>

        <p className="font-body text-sm italic mb-7" style={{ color: 'rgba(245,184,0,0.55)' }}>
          &ldquo;{getRandom(win ? DIALOGUES.playerWins : DIALOGUES.aiWins)}&rdquo;
          <span className="text-xs not-italic ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            — Le Jaguar
          </span>
        </p>

        <button
          onClick={onRestart}
          className="w-full py-3.5 font-display text-2xl tracking-widest rounded-xl transition-all hover:brightness-110 active:scale-95"
          style={{
            background: '#F5B800',
            color: '#0D0B08',
            boxShadow: '0 0 20px rgba(245,184,0,0.4)',
          }}
        >
          REVANCHE
        </button>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const PHASE = {
  PLAYER_ROLL:  'player-roll',
  PLAYER_PLACE: 'player-place',
  AI_TURN:      'ai-turn',
  GAME_OVER:    'game-over',
}

const emptyGrid = () => [[], [], []]

export default function KnucklebonesGame() {
  const [playerGrid, setPlayerGrid] = useState(emptyGrid)
  const [aiGrid,     setAIGrid]     = useState(emptyGrid)
  const [phase,      setPhase]      = useState(PHASE.PLAYER_ROLL)
  const [roll,       setRoll]       = useState(null)
  const [rolling,    setRolling]    = useState(false)
  const [dialog,     setDialog]     = useState(getRandom(DIALOGUES.intro))
  const [aiThinking, setAIThinking] = useState(false)
  const [winner,     setWinner]     = useState(null)
  const [hint,       setHint]       = useState('')

  const playerScore = calcTotalScore(playerGrid)
  const aiScore     = calcTotalScore(aiGrid)

  const checkEndGame = useCallback((pGrid, aGrid) => {
    if (isGridFull(pGrid) || isGridFull(aGrid)) {
      const ps = calcTotalScore(pGrid)
      const as = calcTotalScore(aGrid)
      setWinner(ps >= as ? 'player' : 'ai')
      setPhase(PHASE.GAME_OVER)
      return true
    }
    return false
  }, [])

  // ── Player roll ──
  function handleRoll() {
    if (phase !== PHASE.PLAYER_ROLL) return
    setRolling(true)
    setHint('')
    setTimeout(() => {
      const val = rollDie()
      setRoll(val)
      setRolling(false)
      setPhase(PHASE.PLAYER_PLACE)
      setHint('Choisis une colonne')
    }, 380)
  }

  // ── Player place ──
  function handlePlace(colIdx) {
    if (phase !== PHASE.PLAYER_PLACE) return
    if (playerGrid[colIdx].length >= ROWS) {
      setDialog(getRandom(DIALOGUES.columnFull))
      return
    }

    const newPGrid = placeDieInGrid(playerGrid, colIdx, roll)
    const cancelled = aiGrid[colIdx].filter(v => v === roll).length
    const newAGrid  = cancelled ? cancelDiceInGrid(aiGrid, colIdx, roll) : aiGrid

    if (cancelled) setDialog(getRandom(DIALOGUES.playerCancelsAI))
    else {
      const ps = calcTotalScore(newPGrid)
      const as = calcTotalScore(newAGrid)
      if (ps > as + 12)      setDialog(getRandom(DIALOGUES.playerWinning))
      else if (as > ps + 12) setDialog(getRandom(DIALOGUES.aiWinning))
    }

    setPlayerGrid(newPGrid)
    setAIGrid(newAGrid)
    setRoll(null)
    setHint('')

    if (!checkEndGame(newPGrid, newAGrid)) setPhase(PHASE.AI_TURN)
  }

  // ── AI turn ──
  useEffect(() => {
    if (phase !== PHASE.AI_TURN) return
    setAIThinking(true)
    setHint('Le Jaguar reflechit...')

    const t = setTimeout(() => {
      const aiRoll = rollDie()
      setRoll(aiRoll)
      setRolling(true)

      if (aiRoll >= 5)     setDialog(getRandom(DIALOGUES.aiGoodRoll))
      else if (aiRoll <= 2) setDialog(getRandom(DIALOGUES.aiBadRoll))

      setTimeout(() => {
        setRolling(false)
        const col = getAIColumn(aiGrid, playerGrid, aiRoll)
        if (col === -1) {
          setAIThinking(false)
          setRoll(null)
          setHint('')
          setPhase(PHASE.PLAYER_ROLL)
          return
        }

        const newAGrid = placeDieInGrid(aiGrid, col, aiRoll)
        const cancelled = playerGrid[col].filter(v => v === aiRoll).length
        const newPGrid  = cancelled ? cancelDiceInGrid(playerGrid, col, aiRoll) : playerGrid

        if (cancelled) setDialog(getRandom(DIALOGUES.aiCancelsPlayer))
        else {
          const ps = calcTotalScore(newPGrid)
          const as = calcTotalScore(newAGrid)
          if (as > ps + 12)      setDialog(getRandom(DIALOGUES.aiWinning))
          else if (ps > as + 12) setDialog(getRandom(DIALOGUES.playerWinning))
        }

        setAIGrid(newAGrid)
        setPlayerGrid(newPGrid)
        setAIThinking(false)
        setRoll(null)
        setHint('')

        if (!checkEndGame(newPGrid, newAGrid)) setPhase(PHASE.PLAYER_ROLL)
      }, 550)
    }, 1000)

    return () => clearTimeout(t)
  }, [phase]) // eslint-disable-line

  // ── Restart ──
  function handleRestart() {
    setPlayerGrid(emptyGrid())
    setAIGrid(emptyGrid())
    setPhase(PHASE.PLAYER_ROLL)
    setRoll(null)
    setRolling(false)
    setWinner(null)
    setAIThinking(false)
    setHint('')
    setDialog(getRandom(DIALOGUES.intro))
  }

  const canPlace = phase === PHASE.PLAYER_PLACE
  const canRoll  = phase === PHASE.PLAYER_ROLL

  // ── RENDER ──
  return (
    <div
      className="min-h-screen flex flex-col items-center px-3 py-5 select-none overflow-x-hidden"
      style={{
        backgroundImage: `url("${import.meta.env.BASE_URL}bg.jpg")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay to keep readability */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(5,4,2,0.55) 0%, rgba(5,4,2,0.4) 50%, rgba(5,4,2,0.7) 100%)' }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col gap-3">

        {/* ── Header / Logo ── */}
        <header className="flex flex-col items-center gap-2 pt-2 pb-1">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Jungle Kabal"
            className="h-28 w-auto object-contain drop-shadow-lg"
            onError={e => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextSibling.style.display = 'flex'
            }}
          />
          {/* Fallback text logo */}
          <div className="hidden flex-col items-center">
            <span
              className="font-display text-4xl tracking-[0.2em] uppercase"
              style={{ color: '#F5B800', textShadow: '0 0 20px rgba(245,184,0,0.5)' }}
            >
              JUNGLE KABAL
            </span>
          </div>
          <h1
            className="font-display text-5xl tracking-[0.3em] uppercase"
            style={{ color: '#F5B800', textShadow: '0 0 24px rgba(245,184,0,0.45)' }}
          >
            KNUCKLEBONES
          </h1>
        </header>

        {/* ── AI section ── */}
        <section
          className="rounded-2xl p-3"
          style={{
            background: 'rgba(8,6,3,0.78)',
            border: '1px solid rgba(245,184,0,0.15)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* AI dialogue + score */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <AIBubble text={dialog} isThinking={aiThinking} />
            <div className="flex flex-col items-end flex-shrink-0">
              <span
                className="font-display text-4xl leading-none"
                style={{ color: '#F5B800', textShadow: '0 0 12px rgba(245,184,0,0.4)' }}
              >
                {aiScore}
              </span>
              <span className="font-body text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Jaguar
              </span>
            </div>
          </div>

          {/* AI grid */}
          <div className="flex flex-col items-center gap-1">
            <KGrid grid={aiGrid} isPlayerGrid={false} canPlace={false} onPlace={() => {}} />
            <ColumnScores grid={aiGrid} />
          </div>
        </section>

        {/* ── VS separator + central die ── */}
        <section className="flex items-center gap-3 px-1">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(245,184,0,0.3))' }} />

          <div className="flex flex-col items-center gap-2">
            <RollDie value={roll} isRolling={rolling} />

            {hint && (
              <p
                className="font-body text-xs tracking-widest uppercase animate-fade-in"
                style={{ color: canPlace ? '#F5B800' : 'rgba(255,255,255,0.4)' }}
              >
                {hint}
              </p>
            )}

            {canRoll && (
              <button
                onClick={handleRoll}
                className="px-8 py-3 font-display text-2xl tracking-widest rounded-xl transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: '#F5B800',
                  color: '#0D0B08',
                  boxShadow: '0 0 18px rgba(245,184,0,0.45)',
                }}
              >
                LANCER
              </button>
            )}

            {phase === PHASE.AI_TURN && (
              <p className="font-body text-sm tracking-wider animate-pulse" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Tour du Jaguar...
              </p>
            )}

            {/* Turn indicator */}
            <div className="flex items-center gap-2 text-xs tracking-widest uppercase font-body">
              <span
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: canPlace || canRoll ? '#F5B800' : 'rgba(255,255,255,0.15)',
                  boxShadow: canPlace || canRoll ? '0 0 6px #F5B800' : 'none',
                }}
              />
              <span style={{ color: canPlace || canRoll ? '#F5B800' : 'rgba(255,255,255,0.3)' }}>Toi</span>
              <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
              <span style={{ color: phase === PHASE.AI_TURN ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}>Jaguar</span>
              <span
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: phase === PHASE.AI_TURN ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
                  boxShadow: phase === PHASE.AI_TURN ? '0 0 6px rgba(255,255,255,0.5)' : 'none',
                }}
              />
            </div>
          </div>

          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(245,184,0,0.3))' }} />
        </section>

        {/* ── Player section ── */}
        <section
          className="rounded-2xl p-3"
          style={{
            background: 'rgba(8,6,3,0.78)',
            border: canPlace
              ? '1px solid rgba(245,184,0,0.4)'
              : '1px solid rgba(245,184,0,0.15)',
            backdropFilter: 'blur(8px)',
            boxShadow: canPlace ? '0 0 20px rgba(245,184,0,0.12)' : 'none',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        >
          {/* Player grid */}
          <div className="flex flex-col items-center gap-1 mb-3">
            <ColumnScores grid={playerGrid} />
            <KGrid
              grid={playerGrid}
              isPlayerGrid={true}
              canPlace={canPlace}
              onPlace={handlePlace}
            />
          </div>

          {/* Player score */}
          <div className="flex items-center justify-between">
            <p className="font-body text-xs tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {canPlace ? '↑ Clique sur une colonne pour placer' : 'Ta grille'}
            </p>
            <div className="flex flex-col items-end">
              <span
                className="font-display text-4xl leading-none"
                style={{ color: '#4ADE80', textShadow: '0 0 12px rgba(74,222,128,0.4)' }}
              >
                {playerScore}
              </span>
              <span className="font-body text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>Toi</span>
            </div>
          </div>
        </section>

        {/* ── Score bar ── */}
        {(playerScore + aiScore) > 0 && (
          <div className="flex items-center gap-2 px-1">
            <span className="font-display text-xs w-8 text-right" style={{ color: '#4ADE80' }}>{playerScore}</span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(playerScore / (playerScore + aiScore)) * 100}%`,
                  background: 'linear-gradient(to right, #4ADE80, #F5B800)',
                }}
              />
            </div>
            <span className="font-display text-xs w-8" style={{ color: '#F5B800' }}>{aiScore}</span>
          </div>
        )}

        {/* ── Rules ── */}
        <details
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(8,6,3,0.7)',
            border: '1px solid rgba(245,184,0,0.1)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <summary
            className="px-4 py-3 font-body text-sm cursor-pointer tracking-wider uppercase"
            style={{ color: 'rgba(245,184,0,0.5)' }}
          >
            Comment jouer ?
          </summary>
          <div
            className="px-4 pb-4 text-sm font-body leading-relaxed space-y-2"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <p>🎲 Lance le de, puis clique sur une colonne pour le placer (max 3 des par colonne).</p>
            <p>
              <span style={{ color: '#F87171' }}>✖</span> Si tu poses un de de la meme valeur que l&apos;adversaire dans la meme colonne, ses des sont <span style={{ color: '#F87171' }}>supprimes</span>.
            </p>
            <p>
              <span style={{ color: '#F5B800' }}>✖2</span> Des identiques dans ta colonne <span style={{ color: '#F5B800' }}>multiplient leur valeur</span> : 2x le meme = x2, 3x le meme = x3 !
            </p>
            <p>🏆 La partie se termine quand une grille est remplie. Le plus grand score gagne.</p>
          </div>
        </details>

        {/* ── Restart ── */}
        {phase !== PHASE.GAME_OVER && (
          <button
            onClick={handleRestart}
            className="self-center font-body text-xs tracking-widest uppercase transition-colors py-1 border-b border-transparent"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#F87171'
              e.currentTarget.style.borderBottomColor = 'rgba(248,113,113,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.25)'
              e.currentTarget.style.borderBottomColor = 'transparent'
            }}
          >
            ↺ Nouvelle partie
          </button>
        )}
      </div>

      {/* ── End screen ── */}
      {phase === PHASE.GAME_OVER && winner && (
        <EndScreen
          winner={winner}
          playerScore={playerScore}
          aiScore={aiScore}
          onRestart={handleRestart}
        />
      )}
    </div>
  )
}
