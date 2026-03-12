import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Flame,
  Eye,
  Swords,
  Search,
  LayoutGrid,
  Table2,
  StickyNote,
  Image as ImageIcon,
  Pencil,
  Trash2,
  X,
  Upload,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = [
  "Watching",
  "Interested",
  "Ready",
  "Entered",
  "Trimmed",
  "Exited",
  "Dead",
  "Recycle Later",
];

const NARRATIVE_ZONES = [
  { id: "ai", title: "AI Agents", subtitle: "automation, infra, bots" },
  { id: "animals", title: "Animals", subtitle: "apes, cats, frogs, jungle lore" },
  { id: "cult", title: "Cult / Community", subtitle: "belief, lore, movement" },
  { id: "meta", title: "CT Meta", subtitle: "current timeline obsession" },
  { id: "political", title: "Political", subtitle: "attention spikes, event-driven" },
  { id: "comeback", title: "Comeback / Revival", subtitle: "old runners waking up" },
];

const INITIAL_META = {
  currentMeta: "AI agents, strong community lore, animal derivatives",
  topLastRunners: "$GOR, $ALPHAAPE, $MONK",
  freshRotation: "Community + cult coins with cleaner branding",
  crowdedTrades: "Late copycats and overextended AI tickers",
  earlyWatch: "Comeback coins with real holders still around",
  mood: "Fast money, short attention, narrative-first market",
};

const INITIAL_CARDS = [
  {
    id: "1",
    ticker: "$GOR",
    narrative: "Animals",
    zone: "animals",
    whyPump:
      "Strong jungle fit, meme clarity, easy to understand, already has attention memory.",
    catalyst: "Community push + meme spread + runner comparison",
    bullCase: "Can become the main jungle animal ticker if timeline picks it up again.",
    bearCase: "Could just be another dead bounce if no fresh CT attention comes in.",
    invalidation: "Loses social momentum and fails to hold narrative relevance.",
    entryIdea: "Starter near fatigue pullback, add only if volume returns.",
    target: "Retest of last local top, then runner extension if meta stays hot.",
    heat: 88,
    conviction: 79,
    status: "Ready",
    notes: "Feels like a clean second-wave play if narrative reactivates.",
    tags: ["Runner", "Strong lore", "Good CT fit"],
  },
  {
    id: "2",
    ticker: "$MONK",
    narrative: "Cult / Community",
    zone: "cult",
    whyPump:
      "Simple brand, sticky meme, tribe energy. Easy for holders to rally around.",
    catalyst: "Cult narrative strengthening + repeat mentions + meme consistency",
    bullCase: "Could become a belief coin rather than a one-day pump.",
    bearCase: "May stay niche if it fails to escape its bubble.",
    invalidation: "Narrative stalls and no new believers enter.",
    entryIdea: "Watch for tight base after runner impulse.",
    target: "Slow grind into leader status inside its sub-meta.",
    heat: 71,
    conviction: 84,
    status: "Watching",
    notes: "Less explosive than hype coins, but stickier if culture catches.",
    tags: ["Cult", "Early", "Might revive"],
  },
  {
    id: "3",
    ticker: "$BOTX",
    narrative: "AI Agents",
    zone: "ai",
    whyPump:
      "AI remains easy narrative fuel and still gets instant attention when packaged well.",
    catalyst: "Bot tooling angle + smart account threads + fast market appetite",
    bullCase: "If AI meta keeps rotating, this can run just on narrative alignment.",
    bearCase: "Too many AI clones. Needs identity, not just the category.",
    invalidation: "Fails to differentiate from generic AI tickers.",
    entryIdea: "Only interesting if it shows social acceleration versus other AI names.",
    target: "Quick momentum trade rather than long hold.",
    heat: 93,
    conviction: 63,
    status: "Interested",
    notes: "High heat, lower trust. Good for attention, not yet for marriage.",
    tags: ["Crowded", "Risky"],
  },
];

const INITIAL_IMAGES = [
  {
    id: "img-1",
    zone: "meta",
    title: "Chart / Meme Placeholder",
    src: "https://placehold.co/600x400/15120d/f4c95d?text=Drop+Chart+or+Meme+Here",
  },
];

const defaultForm = {
  id: "",
  ticker: "",
  narrative: "",
  zone: "ai",
  whyPump: "",
  catalyst: "",
  bullCase: "",
  bearCase: "",
  invalidation: "",
  entryIdea: "",
  target: "",
  heat: 50,
  conviction: 50,
  status: "Watching",
  notes: "",
  tags: "",
};

const tagPresets = [
  "Runner",
  "Early",
  "Crowded",
  "Strong lore",
  "Good CT fit",
  "Risky",
  "Good liquidity",
  "Might revive",
  "Dead cat bounce",
  "Cult",
];

function zoneTone(zoneId) {
  const map = {
    ai: "border-cyan-400/30 bg-cyan-500/5",
    animals: "border-emerald-400/30 bg-emerald-500/5",
    cult: "border-violet-400/30 bg-violet-500/5",
    meta: "border-amber-400/30 bg-amber-500/5",
    political: "border-rose-400/30 bg-rose-500/5",
    comeback: "border-sky-400/30 bg-sky-500/5",
  };
  return map[zoneId] || "border-yellow-400/30 bg-yellow-500/5";
}

function scoreTone(value) {
  if (value >= 80) return "text-emerald-300 border-emerald-400/30 bg-emerald-500/10";
  if (value >= 60) return "text-amber-200 border-amber-400/30 bg-amber-500/10";
  return "text-rose-300 border-rose-400/30 bg-rose-500/10";
}

function statusTone(status) {
  const tones = {
    Watching: "bg-slate-500/20 text-slate-200 border-slate-400/20",
    Interested: "bg-sky-500/20 text-sky-200 border-sky-400/20",
    Ready: "bg-amber-500/20 text-amber-200 border-amber-400/20",
    Entered: "bg-emerald-500/20 text-emerald-200 border-emerald-400/20",
    Trimmed: "bg-violet-500/20 text-violet-200 border-violet-400/20",
    Exited: "bg-zinc-500/20 text-zinc-200 border-zinc-400/20",
    Dead: "bg-rose-500/20 text-rose-200 border-rose-400/20",
    "Recycle Later": "bg-orange-500/20 text-orange-200 border-orange-400/20",
  };
  return tones[status] || tones.Watching;
}

function MetaStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-yellow-500/15 bg-black/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.25em] text-yellow-200/55">{label}</div>
      <div className="mt-2 text-sm leading-relaxed text-stone-100">{value}</div>
    </div>
  );
}

function CoinCard({ card, onEdit, onDelete }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden rounded-2xl border border-yellow-400/15 bg-[#16110d]/95 shadow-2xl shadow-black/30">
        <CardHeader className="space-y-3 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg tracking-wide text-yellow-100">{card.ticker}</CardTitle>
              <div className="mt-1 text-xs uppercase tracking-[0.22em] text-yellow-200/45">{card.narrative}</div>
            </div>
            <Badge className={`border ${statusTone(card.status)}`}>{card.status}</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge className={`border ${scoreTone(card.heat)}`}>Heat {card.heat}</Badge>
            <Badge className={`border ${scoreTone(card.conviction)}`}>Conviction {card.conviction}</Badge>
            {card.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} className="border border-yellow-500/20 bg-yellow-500/10 text-yellow-100">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0 text-sm text-stone-200">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-yellow-200/50">Why it can pump</div>
            <p className="mt-2 leading-relaxed text-stone-100/90">{card.whyPump}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-yellow-500/10 bg-black/15 p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-yellow-200/45">Catalyst</div>
              <div className="mt-2 text-stone-100/85">{card.catalyst}</div>
            </div>
            <div className="rounded-xl border border-yellow-500/10 bg-black/15 p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-yellow-200/45">Entry idea</div>
              <div className="mt-2 text-stone-100/85">{card.entryIdea}</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="line-clamp-1 text-xs text-stone-400">{card.notes || "No notes yet."}</div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="border-yellow-500/20 bg-transparent text-yellow-100 hover:bg-yellow-500/10" onClick={() => onEdit(card)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button size="sm" variant="outline" className="border-rose-500/20 bg-transparent text-rose-200 hover:bg-rose-500/10" onClick={() => onDelete(card.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function JungleKabalNarrativeWarRoom() {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [images, setImages] = useState(INITIAL_IMAGES);
  const [meta, setMeta] = useState(INITIAL_META);
  const [view, setView] = useState("board");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeCard, setActiveCard] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [showModal, setShowModal] = useState(false);
  const [draggedCardId, setDraggedCardId] = useState(null);
  const fileRef = useRef(null);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        card.ticker.toLowerCase().includes(q) ||
        card.narrative.toLowerCase().includes(q) ||
        card.tags.join(" ").toLowerCase().includes(q) ||
        card.whyPump.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || card.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cards, search, statusFilter]);

  const zoneStats = useMemo(() => {
    return NARRATIVE_ZONES.map((zone) => {
      const zoneCards = cards.filter((c) => c.zone === zone.id);
      const avgHeat = zoneCards.length
        ? Math.round(zoneCards.reduce((acc, c) => acc + Number(c.heat || 0), 0) / zoneCards.length)
        : 0;
      return { ...zone, count: zoneCards.length, avgHeat };
    });
  }, [cards]);

  const sortedTableCards = useMemo(() => {
    return [...filteredCards].sort((a, b) => Number(b.heat) - Number(a.heat));
  }, [filteredCards]);

  const openCreate = () => {
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (card) => {
    setForm({ ...card, tags: card.tags.join(", ") });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(defaultForm);
  };

  const saveCard = () => {
    const payload = {
      ...form,
      id: form.id || String(Date.now()),
      heat: Number(form.heat || 0),
      conviction: Number(form.conviction || 0),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    setCards((prev) => {
      const exists = prev.some((c) => c.id === payload.id);
      return exists ? prev.map((c) => (c.id === payload.id ? payload : c)) : [payload, ...prev];
    });

    if (activeCard?.id === payload.id) setActiveCard(payload);
    closeModal();
  };

  const deleteCard = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (activeCard?.id === id) setActiveCard(null);
  };

  const moveCardToZone = (cardId, zoneId) => {
    setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, zone: zoneId } : card)));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) => [
          {
            id: `${Date.now()}-${file.name}`,
            zone: "meta",
            title: file.name,
            src: reader.result,
          },
          ...prev,
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0907] text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,201,93,0.13),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(120,53,15,0.22),transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1800px] gap-4 p-4 lg:p-6">
        <div className="flex-1 space-y-4">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden rounded-[28px] border border-yellow-500/15 bg-gradient-to-br from-[#1c140f] via-[#100d0a] to-[#0c0907] shadow-2xl shadow-black/40">
              <CardContent className="p-5 lg:p-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-yellow-100/80">
                      <Swords className="h-3.5 w-3.5" /> Jungle Kabal
                    </div>
                    <div>
                      <h1 className="text-3xl font-semibold tracking-wide text-yellow-50 lg:text-5xl">Narrative War Room</h1>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-300 lg:text-base">
                        One board to track the meta, map narratives, rank conviction, and store the thesis behind every memecoin play.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={openCreate} className="rounded-2xl bg-yellow-300 text-black hover:bg-yellow-200">
                      <Plus className="mr-2 h-4 w-4" /> New coin card
                    </Button>
                    <Button onClick={() => fileRef.current?.click()} variant="outline" className="rounded-2xl border-yellow-500/20 bg-transparent text-yellow-100 hover:bg-yellow-500/10">
                      <Upload className="mr-2 h-4 w-4" /> Add images
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <MetaStat label="Current meta" value={meta.currentMeta} />
                  <MetaStat label="Top last runners" value={meta.topLastRunners} />
                  <MetaStat label="Fresh rotation" value={meta.freshRotation} />
                  <MetaStat label="Crowded trades" value={meta.crowdedTrades} />
                  <MetaStat label="Early watch" value={meta.earlyWatch} />
                  <MetaStat label="Today's mood" value={meta.mood} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
            <Card className="rounded-[26px] border border-yellow-500/15 bg-[#120e0b]/95 shadow-xl shadow-black/25">
              <CardContent className="space-y-5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.32em] text-yellow-200/55">Control panel</div>
                    <div className="mt-1 text-lg font-medium text-yellow-50">Market filter</div>
                  </div>
                  <Filter className="h-4 w-4 text-yellow-200/60" />
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticker, narrative, tag..." className="rounded-2xl border-yellow-500/15 bg-black/20 pl-9 text-stone-100 placeholder:text-stone-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => setView("board")} variant="outline" className={`rounded-2xl border-yellow-500/20 ${view === "board" ? "bg-yellow-500/10 text-yellow-50" : "bg-transparent text-stone-300"}`}>
                      <LayoutGrid className="mr-2 h-4 w-4" /> Board
                    </Button>
                    <Button onClick={() => setView("table")} variant="outline" className={`rounded-2xl border-yellow-500/20 ${view === "table" ? "bg-yellow-500/10 text-yellow-50" : "bg-transparent text-stone-300"}`}>
                      <Table2 className="mr-2 h-4 w-4" /> Table
                    </Button>
                  </div>

                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-[0.25em] text-yellow-200/45">Status</div>
                    <div className="flex flex-wrap gap-2">
                      {["All", ...STATUS_OPTIONS].map((item) => (
                        <button
                          key={item}
                          onClick={() => setStatusFilter(item)}
                          className={`rounded-full border px-3 py-1 text-xs transition ${
                            statusFilter === item
                              ? "border-yellow-400/30 bg-yellow-500/10 text-yellow-100"
                              : "border-yellow-500/10 bg-black/10 text-stone-300 hover:bg-yellow-500/5"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-yellow-500/10 pt-4">
                  <div className="text-xs uppercase tracking-[0.32em] text-yellow-200/55">Narrative heat</div>
                  {zoneStats.map((zone) => (
                    <div key={zone.id} className="rounded-2xl border border-yellow-500/10 bg-black/15 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm text-yellow-50">{zone.title}</div>
                          <div className="text-xs text-stone-400">{zone.count} cards</div>
                        </div>
                        <Badge className={`border ${scoreTone(zone.avgHeat)}`}>Heat {zone.avgHeat}</Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t border-yellow-500/10 pt-4">
                  <div className="text-xs uppercase tracking-[0.32em] text-yellow-200/55">Quick tags</div>
                  <div className="flex flex-wrap gap-2">
                    {tagPresets.map((tag) => (
                      <Badge key={tag} className="border border-yellow-500/20 bg-yellow-500/10 text-yellow-100">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {view === "board" ? (
                <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                  {NARRATIVE_ZONES.map((zone) => {
                    const zoneCards = filteredCards.filter((card) => card.zone === zone.id);
                    const zoneImages = images.filter((img) => img.zone === zone.id || (img.zone === "meta" && zone.id === "meta"));

                    return (
                      <div
                        key={zone.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedCardId) moveCardToZone(draggedCardId, zone.id);
                          setDraggedCardId(null);
                        }}
                        className={`rounded-[28px] border p-4 lg:p-5 ${zoneTone(zone.id)}`}
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xl font-medium text-yellow-50">{zone.title}</div>
                            <div className="mt-1 text-sm text-stone-400">{zone.subtitle}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="border border-yellow-500/20 bg-yellow-500/10 text-yellow-100">{zoneCards.length} cards</Badge>
                          </div>
                        </div>

                        {zoneImages.length > 0 && (
                          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {zoneImages.map((img) => (
                              <div key={img.id} className="overflow-hidden rounded-2xl border border-yellow-500/10 bg-black/15">
                                <img src={img.src} alt={img.title} className="h-36 w-full object-cover" />
                                <div className="border-t border-yellow-500/10 px-3 py-2 text-xs text-stone-300">{img.title}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          {zoneCards.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-yellow-500/15 bg-black/10 p-8 text-center text-sm text-stone-400">
                              Drop a coin card here to map this narrative.
                            </div>
                          ) : (
                            zoneCards.map((card) => (
                              <div
                                key={card.id}
                                draggable
                                onDragStart={() => setDraggedCardId(card.id)}
                                onClick={() => setActiveCard(card)}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <CoinCard card={card} onEdit={openEdit} onDelete={deleteCard} />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="rounded-[28px] border border-yellow-500/15 bg-[#120e0b]/95 shadow-xl shadow-black/25">
                  <CardContent className="overflow-x-auto p-0">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-yellow-500/10 bg-black/20 text-xs uppercase tracking-[0.25em] text-yellow-200/55">
                        <tr>
                          <th className="px-4 py-4">Ticker</th>
                          <th className="px-4 py-4">Narrative</th>
                          <th className="px-4 py-4">Heat</th>
                          <th className="px-4 py-4">Conviction</th>
                          <th className="px-4 py-4">Status</th>
                          <th className="px-4 py-4">Entry idea</th>
                          <th className="px-4 py-4">Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTableCards.map((card) => (
                          <tr key={card.id} className="border-b border-yellow-500/10 hover:bg-yellow-500/5" onClick={() => setActiveCard(card)}>
                            <td className="px-4 py-4 font-medium text-yellow-50">{card.ticker}</td>
                            <td className="px-4 py-4 text-stone-300">{card.narrative}</td>
                            <td className="px-4 py-4"><Badge className={`border ${scoreTone(card.heat)}`}>{card.heat}</Badge></td>
                            <td className="px-4 py-4"><Badge className={`border ${scoreTone(card.conviction)}`}>{card.conviction}</Badge></td>
                            <td className="px-4 py-4"><Badge className={`border ${statusTone(card.status)}`}>{card.status}</Badge></td>
                            <td className="max-w-[280px] px-4 py-4 text-stone-300">{card.entryIdea}</td>
                            <td className="px-4 py-4 text-stone-300">{card.tags.join(", ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <aside className="hidden w-[360px] shrink-0 xl:block">
          <Card className="sticky top-6 rounded-[28px] border border-yellow-500/15 bg-[#120e0b]/95 shadow-2xl shadow-black/25">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.32em] text-yellow-200/55">Coin detail</div>
                  <div className="mt-1 text-xl font-medium text-yellow-50">{activeCard ? activeCard.ticker : "Select a card"}</div>
                </div>
                <Eye className="h-4 w-4 text-yellow-200/60" />
              </div>

              {!activeCard ? (
                <div className="mt-6 rounded-2xl border border-dashed border-yellow-500/15 bg-black/10 p-6 text-sm leading-relaxed text-stone-400">
                  Click a coin card to open the full thesis, risk notes, and execution plan.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`border ${statusTone(activeCard.status)}`}>{activeCard.status}</Badge>
                    <Badge className={`border ${scoreTone(activeCard.heat)}`}>Heat {activeCard.heat}</Badge>
                    <Badge className={`border ${scoreTone(activeCard.conviction)}`}>Conviction {activeCard.conviction}</Badge>
                  </div>

                  {[
                    ["Narrative", activeCard.narrative],
                    ["Why I think it can pump", activeCard.whyPump],
                    ["Catalyst", activeCard.catalyst],
                    ["Bull case", activeCard.bullCase],
                    ["Bear case", activeCard.bearCase],
                    ["Invalidation", activeCard.invalidation],
                    ["Entry idea", activeCard.entryIdea],
                    ["Target", activeCard.target],
                    ["Notes", activeCard.notes || "No notes yet."],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-yellow-500/10 bg-black/15 p-4">
                      <div className="text-[10px] uppercase tracking-[0.25em] text-yellow-200/45">{label}</div>
                      <div className="mt-2 text-sm leading-relaxed text-stone-100/90">{value}</div>
                    </div>
                  ))}

                  <div className="rounded-2xl border border-yellow-500/10 bg-black/15 p-4">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-yellow-200/45">Tags</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeCard.tags.map((tag) => (
                        <Badge key={tag} className="border border-yellow-500/20 bg-yellow-500/10 text-yellow-100">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button onClick={() => openEdit(activeCard)} className="rounded-2xl bg-yellow-300 text-black hover:bg-yellow-200">
                      <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                    <Button onClick={() => deleteCard(activeCard.id)} variant="outline" className="rounded-2xl border-rose-500/20 bg-transparent text-rose-200 hover:bg-rose-500/10">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-[30px] border border-yellow-500/15 bg-[#120e0b] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-yellow-500/10 px-5 py-4">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-yellow-200/55">Coin thesis builder</div>
                <div className="mt-1 text-2xl font-medium text-yellow-50">{form.id ? "Edit coin card" : "Create new coin card"}</div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full text-stone-300 hover:bg-white/5" onClick={closeModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Ticker</label>
                    <Input value={form.ticker} onChange={(e) => setForm((p) => ({ ...p, ticker: e.target.value }))} placeholder="$TOKEN" className="rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Narrative zone</label>
                    <select value={form.zone} onChange={(e) => setForm((p) => ({ ...p, zone: e.target.value }))} className="h-10 w-full rounded-2xl border border-yellow-500/15 bg-black/20 px-3 text-sm text-stone-100 outline-none">
                      {NARRATIVE_ZONES.map((zone) => (
                        <option key={zone.id} value={zone.id} className="bg-[#120e0b]">
                          {zone.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Narrative</label>
                  <Input value={form.narrative} onChange={(e) => setForm((p) => ({ ...p, narrative: e.target.value }))} placeholder="What bucket does this coin belong to?" className="rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Why I think it can pump</label>
                  <Textarea value={form.whyPump} onChange={(e) => setForm((p) => ({ ...p, whyPump: e.target.value }))} placeholder="Why this deserves attention now..." className="min-h-[120px] rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Catalyst</label>
                  <Textarea value={form.catalyst} onChange={(e) => setForm((p) => ({ ...p, catalyst: e.target.value }))} placeholder="What can make it move?" className="min-h-[90px] rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Bull case</label>
                  <Textarea value={form.bullCase} onChange={(e) => setForm((p) => ({ ...p, bullCase: e.target.value }))} placeholder="Best outcome if thesis is right..." className="min-h-[90px] rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Bear case</label>
                  <Textarea value={form.bearCase} onChange={(e) => setForm((p) => ({ ...p, bearCase: e.target.value }))} placeholder="What can make this fail?" className="min-h-[90px] rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Invalidation</label>
                  <Textarea value={form.invalidation} onChange={(e) => setForm((p) => ({ ...p, invalidation: e.target.value }))} placeholder="What breaks the thesis?" className="min-h-[90px] rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Entry idea</label>
                  <Textarea value={form.entryIdea} onChange={(e) => setForm((p) => ({ ...p, entryIdea: e.target.value }))} placeholder="How would you enter?" className="min-h-[90px] rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Target / upside</label>
                  <Textarea value={form.target} onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))} placeholder="Base target and stretch target..." className="min-h-[90px] rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Notes</label>
                  <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Comparison, lore, context, anything useful..." className="min-h-[90px] rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-yellow-500/10 p-5 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Heat</label>
                <Input type="number" min="0" max="100" value={form.heat} onChange={(e) => setForm((p) => ({ ...p, heat: e.target.value }))} className="rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Conviction</label>
                <Input type="number" min="0" max="100" value={form.conviction} onChange={(e) => setForm((p) => ({ ...p, conviction: e.target.value }))} className="rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Status</label>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))} className="h-10 w-full rounded-2xl border border-yellow-500/15 bg-black/20 px-3 text-sm text-stone-100 outline-none">
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status} className="bg-[#120e0b]">
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.25em] text-yellow-200/50">Tags</label>
                <Input value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="Runner, Early, Strong lore" className="rounded-2xl border-yellow-500/15 bg-black/20 text-stone-100" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-yellow-500/10 p-5">
              <Button variant="outline" onClick={closeModal} className="rounded-2xl border-yellow-500/20 bg-transparent text-stone-200 hover:bg-white/5">
                Cancel
              </Button>
              <Button onClick={saveCard} className="rounded-2xl bg-yellow-300 text-black hover:bg-yellow-200">
                <StickyNote className="mr-2 h-4 w-4" /> Save coin card
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
