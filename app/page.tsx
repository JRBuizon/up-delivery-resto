// app/page.tsx
'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { OrdersQueue } from '../components/OrderQueue';
import { MenuManager } from '../components/MenuManager';

const UP_MAROON = '#7B1113';

const DEMO_RESTAURANTS = [
  { id: 'kanto-cravings', name: 'Kanto Cravings' },
  { id: 'up-tea-hub', name: 'UP Tea Hub' },
  { id: 'silog-stop', name: 'Silog Stop' },
  { id: 'knl-lomian', name: 'KNL Lomian' },
  { id: 'maginhawa-grills', name: 'Maginhawa Grills' },
];

export default function MerchantDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [restaurantId, setRestaurantId] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');
  const [customId, setCustomId] = useState('');
  const [customName, setCustomName] = useState('');

  const handleLogin = (id: string, name: string) => {
    if (!id.trim() || !name.trim()) return;
    setRestaurantId(id);
    setRestaurantName(name);
    setIsLoggedIn(true);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setRestaurantId('');
    setRestaurantName('');
    setActiveTab('orders');
  };

  // Login Screen (Matches Delivery App UI Vibe)
  if (!isLoggedIn) {
    return (
      <div style={styles.loginWrapper}>
        <div style={styles.loginCard}>
          <div style={styles.logoCircle}>
            <span style={{ fontSize: 32 }}>🍳</span>
          </div>
          <h1 style={styles.title}>UP Merchant Portal</h1>
          <p style={styles.subtitle}>
            Manage your campus restaurant, update your menu, and process live orders from fellow Iskos.
          </p>

          <div style={styles.formGroup}>
            <label style={styles.label}>Merchant ID *</label>
            <input
              style={styles.input}
              placeholder="e.g., kanto-cravings"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Restaurant Name *</label>
            <input
              style={styles.input}
              placeholder="e.g., Kanto Cravings"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>

          <button 
            style={styles.loginBtn} 
            onClick={() => handleLogin(customId, customName)}
          >
            Sign In to Dashboard
          </button>

          <div style={styles.demoSection}>
            <p style={styles.demoTitle}>⚡ Quick Fill Demo Merchants:</p>
            <div style={styles.demoRow}>
              {DEMO_RESTAURANTS.map((resto) => (
                <button
                  key={resto.id}
                  style={styles.demoChip}
                  onClick={() => handleLogin(resto.id, resto.name)}
                >
                  {resto.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard Shell
  return (
    <div style={styles.dashboardContainer}>
      <Navbar
        restaurantName={restaurantName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
      />
      <main style={styles.mainContent}>
        {activeTab === 'orders' ? (
          <OrdersQueue restaurantId={restaurantId} />
        ) : (
          <MenuManager restaurantId={restaurantId} />
        )}
      </main>
    </div>
  );
}

const styles = {
  loginWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#F5F5F7',
    padding: 20,
  } as React.CSSProperties,
  loginCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: '32px 24px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  } as React.CSSProperties,
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: UP_MAROON,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
    color: UP_MAROON,
    textAlign: 'center',
  } as React.CSSProperties,
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 1.5,
  } as React.CSSProperties,
  formGroup: {
    width: '100%',
    marginBottom: 12,
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid #E0E0E0',
    backgroundColor: '#F4F4F6',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
  } as React.CSSProperties,
  loginBtn: {
    width: '100%',
    backgroundColor: UP_MAROON,
    color: '#FFF',
    border: 'none',
    padding: '14px',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 12,
    boxShadow: '0 4px 12px rgba(123, 17, 19, 0.2)',
  } as React.CSSProperties,
  demoSection: {
    width: '100%',
    marginTop: 24,
    paddingTop: 16,
    borderTop: '1px solid #EEE',
  } as React.CSSProperties,
  demoTitle: {
    fontSize: 11,
    color: '#777',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  } as React.CSSProperties,
  demoRow: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  } as React.CSSProperties,
  demoChip: {
    backgroundColor: '#FDF0ED',
    color: UP_MAROON,
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
    cursor: 'pointer',
  } as React.CSSProperties,
  dashboardContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#FAFAFA',
  } as React.CSSProperties,
  mainContent: {
    flex: 1,
    overflowY: 'auto',
  } as React.CSSProperties,
};