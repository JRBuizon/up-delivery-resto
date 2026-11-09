'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { OrdersQueue } from '../components/OrderQueue';
import { MenuManager } from '../components/MenuManager';

export default function VendorDashboardPage() {
  // Mock logged-in restaurant for testing (replace with Supabase Auth session)
  const [restaurant] = useState({
    id: 'kanto-cravings',
    name: "Kanto Cravings (Area 2)",
  });
  
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      <Navbar
        restaurantName={restaurant.name}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={() => alert('Signed out!')}
      />

      <main>
        {activeTab === 'orders' ? (
          <OrdersQueue restaurantId={restaurant.id} />
        ) : (
          <MenuManager restaurantId={restaurant.id} />
        )}
      </main>
    </div>
  );
}