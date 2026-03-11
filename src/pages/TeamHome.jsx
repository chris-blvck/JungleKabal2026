import { useState } from 'react'

const TOOLS = [
  {
    id: 'watchlist',
    name: 'WATCHLIST',
    description: 'Tokens surveillés en temps réel',
    icon: '👁',
    status: 'LIVE',
    statusColor: 'text-green-400',
    href: '#watchlist',
    tag: 'MARKET',
  },
  {
    id: 'war-room',
    name: 'WAR ROOM',
    description: 'Revenus, coûts & P&L du squad',
    icon: '⚔️',
    status: 'LIVE',
    statusColor: 'text-green-400',
    href: '#war-room',
    tag: 'FINANCES',
  },
  {
    id: 'crm-angel',
    name: 'CRM ANGEL',
    description: 'Pipeline des deals & investisseurs',
    icon: '🤝',
    status: 'LIVE',
    statusColor: 'text-green-400',
    href: '#crm-angel',
    tag: 'DEALS',
  },
  {
    id: 'risk-manager',
    name: 'RISK MANAGER',
    description: 'Exposition, stops & sizing du portefeuille',
    icon: '🛡',
    status: 'LIVE',
    statusColor: 'text-green-400',
    href: '#risk-manager',
    tag: 'RISK',
  },
  {
    id: 'sprint-board',
    name: 'SPRINT BOARD',
    description: 'Objectifs 90 jours · Mars–Mai 2026',
    icon: '🎯',
    status: 'ACTIVE',
    statusColor: 'text-yellow-400',
    href: '#sprint',
    tag: 'OPS',
  },
  {
    id: 'arsenal',
    name: 'ARSENAL',
    description: 'Outils, scripts & ressources du squad',
    icon: '🔧',
    status: 'ACTIVE',
    statusColor: 'text-yellow-400',
    href: '#arsenal',
    tag: 'TOOLS',
  },
]

const MEMBERS = [
  { name: 'CHRIS', role: 'Commander', avatar: 'C', online: true },
  { name: 'MEMBER 2', role: 'Trader', avatar: 'M', online: true },
  { name: 'MEMBER 3', role: 'Analyst', avatar: 'M', online: false },
  { name: 'MEMBER 4', role: 'Dev', avatar: 'M', online: true },
  { name: 'MEMBER 5', role: 'Hunter', avatar: 'M', online: false },
]

const TAG_COLORS = {
  MARKET: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  FINANCES: 'bg-red-900/40 text-red-300 border-red-700/50',
  DEALS: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
  RISK: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
  OPS: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  TOOLS: 'bg-green-900/40 text-green-300 border-green-700/50',
}

function ToolCard({ tool }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={tool.href}
      className={`
        group relative flex flex-col gap-3 p-5 rounded-lg border cursor-pointer transition-all duration-200
        ${hovered
          ? 'bg-[#1a1f0e] border-[#c9a84c] shadow-[0_0_24px_rgba(201,168,76,0.15)]'
          : 'bg-[#0f1208]/80 border-[#2a2e1a]'
        }
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <span className="text-2xl">{tool.icon}</span>
        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${TAG_COLORS[tool.tag]}`}>
          {tool.tag}
        </span>
      </div>

      {/* Name */}
      <div>
        <h3 className={`font-mono font-bold tracking-widest text-sm transition-colors ${hovered ? 'text-[#c9a84c]' : 'text-[#e8d5a0]'}`}>
          {tool.name}
        </h3>
        <p className="text-[#6b7040] text-xs mt-1 leading-relaxed">{tool.description}</p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5 mt-auto">
        <span className={`w-1.5 h-1.5 rounded-full ${tool.status === 'LIVE' ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
        <span className={`text-xs font-mono ${tool.statusColor}`}>{tool.status}</span>
      </div>

      {/* Arrow on hover */}
      <span className={`absolute right-4 bottom-4 text-[#c9a84c] font-mono text-xs transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        ACCÉDER →
      </span>
    </a>
  )
}

export default function TeamHome() {
  return (
    <div className="min-h-screen bg-[#080a05] text-white font-mono">

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[#1e2210]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border border-[#c9a84c] rounded-sm flex items-center justify-center">
            <span className="text-[#c9a84c] text-xs">◉</span>
          </div>
          <div>
            <span className="text-[#c9a84c] font-bold tracking-widest text-sm">JUNGLE KABAL</span>
            <span className="text-[#4a5020] text-xs ml-2">· TEAM HQ</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-[#4a5020] text-xs tracking-widest hidden md:block">SQUAD OF 5</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs tracking-widest">ONLINE</span>
          </div>
          <div className="text-[#4a5020] text-xs">
            SPRINT · MAR–MAI 2026
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-[#c9a84c]/40" />
            <span className="text-[#c9a84c]/60 text-xs tracking-widest">· 90-DAY SPRINT · MARCH – MAY 2026 ·</span>
            <div className="h-px w-8 bg-[#c9a84c]/40" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-widest text-[#c9a84c] uppercase mb-2">
            KABAL HQ
          </h1>
          <p className="text-[#4a5020] text-sm tracking-wide max-w-xl">
            Base opérationnelle du squad. Accès direct à tous les outils de guerre financière.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1e2210] rounded-lg overflow-hidden mb-10">
          {[
            { label: 'JOURS DE SPRINT', value: '90' },
            { label: 'MEMBRES ACTIFS', value: '5' },
            { label: 'TARGET MAX', value: '$31K' },
            { label: 'TOOLS ACTIFS', value: '6' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#0a0d06] px-5 py-4">
              <div className="text-[#c9a84c] text-2xl font-bold">{stat.value}</div>
              <div className="text-[#4a5020] text-xs tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tools grid */}
        <div className="mb-10">
          <h2 className="text-xs tracking-widest text-[#4a5020] uppercase mb-4 flex items-center gap-2">
            <span className="text-[#c9a84c]">▸</span> COMMAND CENTER · ACCÈS RAPIDE
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </div>

        {/* Squad row */}
        <div className="border border-[#1e2210] rounded-lg p-5 bg-[#0a0d06]">
          <h2 className="text-xs tracking-widest text-[#4a5020] uppercase mb-4 flex items-center gap-2">
            <span className="text-[#c9a84c]">▸</span> INNER CIRCLE · SQUAD
          </h2>
          <div className="flex flex-wrap gap-3">
            {MEMBERS.map((m) => (
              <div key={m.name} className="flex items-center gap-2 bg-[#0f1208] border border-[#1e2210] rounded px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-[#1e2210] border border-[#2a2e1a] flex items-center justify-center text-[#c9a84c] text-xs font-bold">
                  {m.avatar}
                </div>
                <div>
                  <div className="text-[#e8d5a0] text-xs font-bold tracking-wider">{m.name}</div>
                  <div className="text-[#4a5020] text-xs">{m.role}</div>
                </div>
                <span className={`w-1.5 h-1.5 rounded-full ml-1 ${m.online ? 'bg-green-400' : 'bg-[#2a2e1a]'}`} />
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="border-t border-[#1e2210] px-8 py-4 flex items-center justify-between">
        <span className="text-[#2a2e1a] text-xs tracking-widest">JUNGLE KABAL · 2026</span>
        <span className="text-[#2a2e1a] text-xs">INNER CIRCLE · FINANCIAL WARFARE</span>
      </footer>
    </div>
  )
}
