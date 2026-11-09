'use client';

import React from 'react';

interface NavbarProps {
  restaurantName: string;
  activeTab: 'orders' | 'menu';
  setActiveTab: (tab: 'orders' | 'menu') => void;
  onSignOut: () => void;
}

export function Navbar({ restaurantName, activeTab, setActiveTab, onSignOut }: NavbarProps) {
  return (
    <nav style={styles.nav}>
      <div style={styles.brandContainer}>
        <span style={styles.logoIcon}>🛵🍳</span>
        <div>
          <h2 style={styles.brandTitle}>{restaurantName}</h2>
          <span style={styles.partnerBadge}>UP Partner Merchant</span>
        </div>
      </div>

      <div style={styles.navLinks}>
        <button
          style={{
            ...styles.navBtn,
            ...(activeTab === 'orders' ? styles.activeNavBtn : {}),
          }}
          onClick={() => setActiveTab('orders')}
        >
          🛎️ Orders Queue
        </button>
        <button
          style={{
            ...styles.navBtn,
            ...(activeTab === 'menu' ? styles.activeNavBtn : {}),
          }}
          onClick={() => setActiveTab('menu')}
        >
          📋 Edit Menu & Prices
        </button>
      </div>

      <button style={styles.signOutBtn} onClick={onSignOut}>
        Sign Out
      </button>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#7B1113', // UP Maroon
    padding: '14px 28px',
    color: '#FFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  } as React.CSSProperties,
  brandContainer: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: { fontSize: 28 },
  brandTitle: { margin: 0, fontSize: 18, fontWeight: 'bold' },
  partnerBadge: { fontSize: 11, backgroundColor: '#F4A261', color: '#111', padding: '2px 6px', borderRadius: 4, fontWeight: '600' },
  navLinks: { display: 'flex', gap: 10 },
  navBtn: {
    backgroundColor: 'transparent', // 👈 Change 'background' to 'backgroundColor'
    border: 'none',
    color: '#FAD2D2',
    fontSize: 14,
    fontWeight: '600',
    padding: '8px 14px',
    borderRadius: 8,
    cursor: 'pointer',
  } as React.CSSProperties,
  activeNavBtn: { backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF' },
  signOutBtn: {
    backgroundColor: 'transparent', // 👈 Change 'background' to 'backgroundColor'
    border: '1px solid #FAD2D2',
    color: '#FFF',
    padding: '6px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: '600',
  } as React.CSSProperties,
};