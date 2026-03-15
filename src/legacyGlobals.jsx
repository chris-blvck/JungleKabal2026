import React from 'react';

function LegacyPlaceholder({ name }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#F3F4F6', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 760, border: '1px solid rgba(245,166,35,0.35)', background: 'rgba(20,20,20,0.9)', borderRadius: 16, padding: 20 }}>
        <h2 style={{ marginTop: 0, color: '#F5A623' }}>Module temporaire indisponible</h2>
        <p>
          Le module <code>{name}</code> a été appelé mais n'est pas défini dans ce build.
          La page est protégée pour éviter un écran noir global.
        </p>
      </div>
    </div>
  );
}

export function installLegacyGlobalFallbacks() {
  if (typeof window === 'undefined') return;

  const map = {
    TelegramMiniApp: () => <LegacyPlaceholder name="TelegramMiniApp" />,
    AngelOpsDashboard: () => <LegacyPlaceholder name="AngelOpsDashboard" />,
  };

  Object.entries(map).forEach(([name, component]) => {
    if (!(name in globalThis)) {
      globalThis[name] = component;
    }
  });
}
