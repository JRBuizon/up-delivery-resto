'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

export function OrdersQueue({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const playChime = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => console.log('Audio autoplay prevented by browser'));
  };

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (!error && data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('merchant-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          playChime();
          setOrders(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    fetchOrders();
  };

  return (
    <div style={styles.container}>
      <h2>Live Kitchen Order Queue 🛎️</h2>
      <p style={styles.subtitle}>Incoming tickets from campus buyers update in real-time.</p>

      {loading ? <p>Loading orders...</p> : orders.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={{ fontSize: 40, margin: 0 }}>☕</p>
          <h3>No orders yet</h3>
          <p style={{ color: '#777', fontSize: 13 }}>When students place orders on the mobile app, they will appear right here instantly!</p>
        </div>
      ) : (
        <div style={styles.orderGrid}>
          {orders.map(order => {
            const isDelivered = order.status === 'Delivered';
            return (
              <div key={order.id} style={{ ...styles.orderCard, ...(isDelivered ? styles.deliveredCard : {}) }}>
                <div style={styles.orderHeader}>
                  <span style={styles.orderIdBadge}>{order.id}</span>
                  <span style={{ ...styles.statusBadge, ...(isDelivered ? styles.greenBadge : styles.yellowBadge) }}>
                    {order.status}
                  </span>
                </div>

                <div style={styles.customerMeta}>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>👤 {order.customer_name || 'Isko Buyer'}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>📍 Drop-off: {order.dropoff_location}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#555' }}>🛵 Rider: {order.rider_name || 'Waiting for assignment...'}</p>
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
                      <button style={{ ...styles.actionBtn, backgroundColor: '#3B82F6' }} onClick={() => updateOrderStatus(order.id, 'On the Way')}>
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
  container: { padding: 30, maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
  subtitle: { color: '#666', marginBottom: 24, fontSize: 14 },
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