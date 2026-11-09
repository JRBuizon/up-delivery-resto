// components/MenuManager.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  is_available: boolean;
}

export function MenuManager({ restaurantId }: { restaurantId: string }) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const fetchMenu = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: true });

    if (!error && data) setMenu(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchMenu();

    const channel = supabase
      .channel(`merchant-menu-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchMenu()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const handleAddDish = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `item_${Date.now()}`;
    const { error } = await supabase.from('menu_items').insert([
      {
        id: newId,
        restaurant_id: restaurantId,
        name,
        description,
        price: parseFloat(price) || 0,
        image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
        is_available: true,
      },
    ]);

    if (error) {
      alert('Error adding item: ' + error.message);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setImage('');
      fetchMenu();
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !currentStatus })
      .eq('id', id);
    if (error) alert('Error updating status: ' + error.message);
    else fetchMenu();
  };

  const deleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this dish?')) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) alert('Error deleting item: ' + error.message);
      else fetchMenu();
    }
  };

  return (
    <div style={styles.container}>
      <h2>Manage Menu & Pricing 🍲</h2>
      <p style={styles.subtitle}>Add new items or toggle stock availability instantly for campus buyers.</p>

      {/* Add New Dish Form */}
      <form onSubmit={handleAddDish} style={styles.formCard}>
        <h3>Add New Dish</h3>
        <div style={styles.formGrid}>
          <input
            placeholder="Dish Name (e.g. Special Sisig)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />
          <input
            placeholder="Price (₱)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            style={styles.input}
          />
          <input
            placeholder="Image URL (Unsplash link)"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            style={styles.input}
          />
        </div>
        <textarea
          placeholder="Short description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
        />
        <button type="submit" style={styles.addBtn}>+ Add Item to Menu</button>
      </form>

      {/* Existing Menu Items Grid */}
      <h3>Current Menu ({menu.length} items)</h3>
      {loading ? (
        <p>Loading menu...</p>
      ) : (
        <div style={styles.grid}>
          {menu.map((item) => (
            <div key={item.id} style={{ ...styles.card, ...(item.is_available ? {} : styles.soldOutCard) }}>
              <img src={item.image} alt={item.name} style={styles.dishImage} />
              <div style={styles.cardContent}>
                <div style={styles.rowBetween}>
                  <h4 style={styles.dishTitle}>{item.name}</h4>
                  <span style={styles.priceTag}>₱{item.price}.00</span>
                </div>
                <p style={styles.dishDesc}>{item.description}</p>

                <div style={styles.cardActions}>
                  <button
                    style={{
                      ...styles.statusToggleBtn,
                      ...(item.is_available ? styles.availableBtn : styles.unavailableBtn),
                    }}
                    onClick={() => toggleAvailability(item.id, item.is_available)}
                  >
                    {item.is_available ? '🟢 In Stock' : '🔴 Sold Out'}
                  </button>
                  <button style={styles.deleteBtn} onClick={() => deleteItem(item.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 30, maxWidth: 1000, margin: '0 auto' } as React.CSSProperties,
  subtitle: { color: '#666', marginBottom: 24, fontSize: 14 },
  formCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, boxShadow: '0 2px 6px rgba(0,0,0,0.08)', marginBottom: 30, border: '1px solid #EEE' },
  formGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr 2fr', gap: 12, marginBottom: 12 },
  input: { padding: 10, borderRadius: 8, border: '1px solid #CCC', fontSize: 14 },
  textarea: { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #CCC', fontSize: 14, height: 60, marginBottom: 12, boxSizing: 'border-box' } as React.CSSProperties,
  addBtn: { backgroundColor: '#2D6A4F', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  soldOutCard: { opacity: 0.6 },
  dishImage: { width: '100%', height: 140, objectFit: 'cover' as const },
  cardContent: { padding: 14 },
  rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  dishTitle: { margin: 0, fontSize: 16, color: '#222' },
  priceTag: { fontWeight: 'bold', color: '#7B1113', fontSize: 15 },
  dishDesc: { fontSize: 12, color: '#666', height: 32, overflow: 'hidden', marginBottom: 14 },
  cardActions: { display: 'flex', gap: 8 },
  statusToggleBtn: { flex: 1, padding: '8px', borderRadius: 6, border: 'none', fontWeight: 'bold', fontSize: 12, cursor: 'pointer' },
  availableBtn: { backgroundColor: '#D8F3DC', color: '#2D6A4F' },
  unavailableBtn: { backgroundColor: '#FDE2E2', color: '#C53030' },
  deleteBtn: { backgroundColor: '#F3F4F6', color: '#4B5563', border: 'none', padding: '8px 12px', borderRadius: 6, fontWeight: 'bold', fontSize: 12, cursor: 'pointer' },
};