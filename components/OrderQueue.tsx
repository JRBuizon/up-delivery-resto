'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

interface Toast {
  id: string;
  orderId: string;
  customerName: string;
  itemCount: number;
}

export function OrdersQueue({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Function to show a temporary toast notification in top-right
  const triggerToast = (newOrder: any) => {
    const toastId = `toast_${Date.now()}`;
    const newToast: Toast = {
      id: toastId,
      orderId: newOrder.id || `ORD-${Math.floor(Math.random() * 900) + 100}`,
      customerName: newOrder.customer_name || 'Isko Buyer',
      itemCount: newOrder.items?.length || 1,
    };

    setToasts((prev) => [newToast, ...prev]);

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error.message);
    } else if (data) {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log(`📡 Subscribing to orders for restaurant_id: ${restaurantId}`);
    fetchOrders();

    const channel = supabase
      .channel('merchant-orders')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'orders', 
          filter: `restaurant_id=eq.${restaurantId}` 
        },
        (payload) => {
          console.log('🔔 Realtime order received:', payload);
          triggerToast(payload.new);
          setOrders((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  // Test Simulation Button Handler
  const handleTestSimulation = () => {
    const mockOrder = {
      id: `test_${Math.floor(Math.random() * 9000) + 1000}`,
      restaurant_id: restaurantId,
      customer_name: 'Test Isko',
      dropoff_location: 'Palma Hall 2nd Floor',
      total_price: 180,
      status: 'Confirmed',
      items: [{ name: 'Crispy Sisig Rice Bowl', quantity: 2, price: 90 }],
      created_at: new Date().toISOString(),
    };

    triggerToast(mockOrder);
    setOrders((prev) => [mockOrder, ...prev]);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      alert('Failed to update status: ' + error.message);
    } else {
      fetchOrders();
    }
  };

  return (
    <div style={styles.container}>
      {/* Top-Right Toast Notification Container */}
      <div style={styles.toastContainer}>
        {toasts.map((toast) => (
          <div key={toast.id} style={styles.toastCard}>
            <div style={styles.toastIcon}>🛎️</div>
            <div style={{ flex: 1 }}>
              <div style={styles.toastTitle}>New Order Received!</div>
              <div style={styles.toastBody}>
                Order #{toast.orderId} • {toast.customerName} ({toast.itemCount} items)
              </div>
            </div>
            <button style={styles.toastCloseBtn} onClick={() => removeToast(toast.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>

      <div style={styles.headerRow}>
        <div>
          <h2>Live Kitchen Order Queue 🛎️</h2>
          <p style={styles.subtitle}>Incoming tickets from campus buyers update in real-time.</p>
        </div>
        {/* Test Simulation Button */}
        <button style={styles.testBtn} onClick={handleTestSimulation}>
          🧪 Simulate Incoming Order
        </button>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: 40, margin: 0 }}>☕</p>
          <h3>No orders yet</h3>
          <p style={{ color: '#777', fontSize: 13 }}>
            When students place orders on the mobile app, they will appear right here instantly!
          </p>
        </div>
      ) : (
        <div style={styles.orderGrid}>
          {orders.map((order) => {
            const isDelivered = order.status === 'Delivered';
            return (
              <div
                key={order.id}
                style={{
                  ...styles.orderCard,
                  ...(isDelivered ? styles.deliveredCard : {}),
                }}
              >
                <div style={styles.orderHeader}>
                  <span style={styles.orderIdBadge}>{order.id}</span>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(isDelivered ? styles.greenBadge : styles.yellowBadge),
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                <div style={styles.customerMeta}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>
                    👤 {order.customer_name || 'Isko Buyer'}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>
                    📍 Drop-off: {order.dropoff_location}
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#555' }}>
                    🛵 Rider: {order.rider_name || 'Waiting for assignment...'}
                  </p>
                </div>

                <div style={styles.itemsList}>
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} style={styles.itemRow}>
                      <span style={{ fontWeight: 'bold', color: '#7B1113' }}>{item.quantity}x</span>
                      <span style={{ flex: 1, marginLeft: 8 }}>{item.name}</span>
                      <span>₱{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.orderFooter}>
                  <div>
                    <span style={{ fontSize: 11, color: '#888' }}>Total Amount</span>
                    <h4 style={{ margin: 0, color: '#111' }}>₱{order.total_price}</h4>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {order.status === 'Confirmed' && (
                      <button style={styles.actionBtn} onClick={() => updateOrderStatus(order.id, 'Preparing')}>
                        Accept & Prep 🍳
                      </button>
                    )}
                    {order.status === 'Preparing' && (
                      <button
                        style={{ ...styles.actionBtn, backgroundColor: '#3B82F6' }}
                        onClick={() => updateOrderStatus(order.id, 'On the Way')}
                      >
                        Hand to Rider 🛵
                      </button>
                    )}
                    {order.status === 'On the Way' && (
                      <span style={{ fontSize: 12, fontWeight: 'bold', color: '#D97706' }}>Out for delivery</span>
                    )}
                    {order.status === 'Delivered' && (
                      <span style={{ fontSize: 12, fontWeight: 'bold', color: '#2D6A4F' }}>Completed ✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 30, maxWidth: 1100, margin: '0 auto', position: 'relative' } as React.CSSProperties,
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  subtitle: { color: '#666', margin: 0, fontSize: 14 },
  testBtn: { backgroundColor: '#7B1113', color: '#FFF', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 'bold', fontSize: 13, cursor: 'pointer' },
  
  toastContainer: {
    position: 'fixed',
    top: 20,
    right: 20,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxWidth: 340,
    width: '100%',
  } as React.CSSProperties,
  toastCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    color: '#FFF',
    padding: '14px 16px',
    borderRadius: 12,
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
    borderLeft: '4px solid #7B1113',
    animation: 'slideIn 0.3s ease-out forwards',
  } as React.CSSProperties,
  toastIcon: { fontSize: 24 },
  toastTitle: { fontWeight: 'bold', fontSize: 14, color: '#FFF' },
  toastBody: { fontSize: 12, color: '#CBD5E1', marginTop: 2 },
  toastCloseBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    fontSize: 14,
    padding: 4,
  } as React.CSSProperties,

  emptyState: { textAlign: 'center' as const, padding: 60, backgroundColor: '#FFF', borderRadius: 12, border: '1px solid #EEE' },
  orderGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 },
  orderCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '5px solid #F59E0B' },
  deliveredCard: { borderLeft: '5px solid #2D6A4F', opacity: 0.8 },
  orderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderIdBadge: { fontWeight: '900', fontSize: 14, color: '#333' },
  statusBadge: { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 'bold' },
  yellowBadge: { backgroundColor: '#FEF3C7', color: '#92400E' },
  greenBadge: { backgroundColor: '#D8F3DC', color: '#2D6A4F' },
  customerMeta: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 },
  itemsList: { marginBottom: 14, borderBottom: '1px solid #F0F0F0', paddingBottom: 10 },
  itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 },
  orderFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  actionBtn: { backgroundColor: '#2D6A4F', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 'bold', fontSize: 12, cursor: 'pointer' },
};