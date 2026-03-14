import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' };
  }

  componentDidCatch(error, info) {
    console.error('Global render crash:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const host = typeof window !== 'undefined' ? window.location.hostname : 'unknown-host';
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#F3F4F6', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 700, border: '1px solid rgba(245,166,35,0.35)', background: 'rgba(20,20,20,0.9)', borderRadius: 16, padding: 20 }}>
          <h1 style={{ marginTop: 0, color: '#F5A623' }}>Jungle Kabal — Recover Mode</h1>
          <p>L'application a rencontré une erreur de rendu. Recharge la page (Ctrl+F5). Si ça persiste, vide le localStorage du site puis réessaie.</p>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Host détecté: <code>{host}</code></p>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Erreur: <code>{this.state.message}</code></p>
        </div>
      </div>
    );
  }
}
