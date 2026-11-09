'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import { CAMPUS_LOCATIONS, UPD_BOUNDS } from '../constants/locations';
import {
  CATEGORIES,
  DEFAULT_RESTAURANT_IMAGE,
  DELIVERY_TIMES,
  PRICE_RANGES,
} from '../constants/restaurants';

const UP_MAROON = '#7B1113';
// Matches the existing `restaurants` table in Supabase:
// id, email, name, category, price_range, rating, delivery_time, image,
// is_popular, is_student_owned, latitude, longitude, created_at
const STEPS = ['Store Details', 'Location', 'Review'] as const;

interface FormState {
  // Step 1 — Store details
  restaurantName: string;
  email: string;
  category: string;
  priceRange: string;
  deliveryTime: string;
  image: string;
  isStudentOwned: boolean;
  // Step 2 — Location (landmark only helps fill in lat/lng; it is not saved)
  landmark: string;
  latitude: string;
  longitude: string;
}

const INITIAL_FORM: FormState = {
  restaurantName: '',
  email: '',
  category: CATEGORIES[0],
  priceRange: PRICE_RANGES[0].value,
  deliveryTime: DELIVERY_TIMES[1],
  image: '',
  isStudentOwned: false,
  landmark: '',
  latitude: '',
  longitude: '',
};

// "Kanto Cravings (Area 2)" -> "kanto-cravings-area-2" — same id style as the customer app.
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Returns an error message for the given step, or null if the step is valid.
function validateStep(step: number, form: FormState): string | null {
  if (step === 0) {
    if (form.restaurantName.trim().length < 2) return 'Please enter your restaurant name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid store email address.';
    if (!slugify(form.restaurantName)) return 'Restaurant name needs at least one letter or number.';
    if (form.image && !/^https?:\/\//.test(form.image.trim())) return 'Image URL must start with http:// or https://';
  }
  if (step === 1) {
    const lat = parseFloat(form.latitude);
    const lng = parseFloat(form.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return 'Please set your location (pick a landmark or use your current location).';
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return 'Those coordinates are out of range.';
  }
  return null;
}

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [done, setDone] = useState<{ id: string; name: string } | null>(null);

  // One generic updater instead of a useState per field.
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const lat = parseFloat(form.latitude);
  const lng = parseFloat(form.longitude);
  const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lng);
  const looksOffCampus =
    hasCoords &&
    (lat < UPD_BOUNDS.minLat || lat > UPD_BOUNDS.maxLat || lng < UPD_BOUNDS.minLng || lng > UPD_BOUNDS.maxLng);

  const handleLandmarkChange = (name: string) => {
    const spot = CAMPUS_LOCATIONS.find((l) => l.name === name);
    setForm((prev) => ({
      ...prev,
      landmark: name,
      latitude: spot ? String(spot.latitude) : prev.latitude,
      longitude: spot ? String(spot.longitude) : prev.longitude,
    }));
    setError(null);
  };

  // Browser equivalent of expo-location's getCurrentPositionAsync().
  const detectCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location access. Pick a landmark instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setLocating(false);
        setError(null);
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Pick the nearest landmark instead.'
            : 'Could not get your location. Pick the nearest landmark instead.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const goNext = () => {
    const message = validateStep(step, form);
    if (message) {
      setError(message);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  // Insert the restaurant row; if the slug is taken, retry once with a short suffix.
  const insertRestaurant = async () => {
    const baseId = slugify(form.restaurantName);
    const row = {
      email: form.email.trim().toLowerCase(),
      name: form.restaurantName.trim(),
      category: form.category,
      price_range: form.priceRange,
      delivery_time: form.deliveryTime,
      image: form.image.trim() || DEFAULT_RESTAURANT_IMAGE,
      is_student_owned: form.isStudentOwned,
      is_popular: false,
      rating: 0, // no reviews yet
      latitude: lat,
      longitude: lng,
    };

    let id = baseId;
    let { error: insertError } = await supabase.from('restaurants').insert([{ id, ...row }]);

    // 23505 = Postgres unique_violation (another restaurant already uses this id).
    if (insertError?.code === '23505') {
      id = `${baseId}-${Math.random().toString(36).slice(2, 6)}`;
      ({ error: insertError } = await supabase.from('restaurants').insert([{ id, ...row }]));
    }
    return { id, insertError };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== STEPS.length - 1) {
      goNext();
      return;
    }

    // Re-check every step in case something was edited after going back.
    for (let i = 0; i < STEPS.length - 1; i++) {
      const message = validateStep(i, form);
      if (message) {
        setStep(i);
        setError(message);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    // 1) The store email works like a username, so make sure it isn't taken yet.
    const email = form.email.trim().toLowerCase();
    const { data: existing, error: lookupError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (lookupError) {
      setSubmitting(false);
      setError(
        // supabase-js reports "TypeError: Failed to fetch" when the network/server can't be reached
        lookupError.message.includes('Failed to fetch')
          ? 'Could not reach the server. Check your internet connection and the Supabase keys in .env.'
          : `Could not check email: ${lookupError.message}`
      );
      return;
    }
    if (existing && existing.length > 0) {
      setSubmitting(false);
      setError('A restaurant is already registered with this email.');
      return;
    }

    // 2) Save the restaurant.
    const { id, insertError } = await insertRestaurant();
    setSubmitting(false);

    if (insertError) {
      // 42501 = insufficient_privilege: Row Level Security blocked the insert.
      setError(
        insertError.code === '42501'
          ? 'The database is not allowing new restaurants yet (Row Level Security). Ask whoever manages Supabase to allow inserts on the restaurants table.'
          : insertError.message.includes('Failed to fetch')
            ? 'Could not reach the server. Check your internet connection and try again.'
            : `Could not save restaurant: ${insertError.message}`
      );
      return;
    }

    setDone({ id, name: form.restaurantName.trim() });
  };

  const header = (
    <header style={styles.header}>
      <div style={styles.brandContainer}>
        <span style={styles.logoIcon}>🛵🍳</span>
        <div>
          <h2 style={styles.brandTitle}>Merchant Registration</h2>
          <span style={styles.partnerBadge}>UP Partner Merchant</span>
        </div>
      </div>
      <Link href="/" style={styles.headerLink}>
        Sign In
      </Link>
    </header>
  );

  if (done) {
    return (
      <div style={styles.page}>
        {header}
        <div style={{ ...styles.card, textAlign: 'center', marginTop: 28 }}>
          <p style={{ fontSize: 48, margin: 0 }}>🎉</p>
          <h2 style={{ margin: '8px 0', color: '#222' }}>{done.name} is registered!</h2>
          <p style={styles.subtitle}>
            Sign in to the Merchant Portal with this Merchant ID and your restaurant name, then add dishes
            to your menu so campus buyers can start ordering.
          </p>
          <p style={styles.idBox}>
            Merchant ID: <code style={styles.code}>{done.id}</code>
          </p>
          <button style={styles.primaryBtn} onClick={() => router.push('/')}>
            Go to Merchant Login →
          </button>
        </div>
      </div>
    );
  }

  const isLastStep = step === STEPS.length - 1;

  return (
    <div style={styles.page}>
      {header}

      <div style={styles.intro}>
        <h2 style={{ margin: '0 0 6px' }}>Register Your Eatery 🏪</h2>
        <p style={{ ...styles.subtitle, marginBottom: 0 }}>
          Join UP Delivery and start receiving orders from campus buyers in a few minutes.
        </p>
      </div>

      {/* Step indicator */}
      <ol style={styles.stepper}>
        {STEPS.map((label, i) => (
          <li key={label} style={styles.stepItem}>
            <span
              style={{
                ...styles.stepDot,
                ...(i < step ? styles.stepDotDone : {}),
                ...(i === step ? styles.stepDotActive : {}),
              }}
            >
              {i < step ? '✓' : i + 1}
            </span>
            <span style={{ ...styles.stepLabel, ...(i === step ? { color: UP_MAROON, fontWeight: 700 } : {}) }}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} style={styles.card} noValidate>
        {step === 0 && (
          <>
            <h3 style={styles.sectionTitle}>Store Details</h3>
            <p style={styles.subtitle}>This is what students will see in the UP Delivery app.</p>
            <Field label="Restaurant Name" hint={form.restaurantName ? `Merchant ID: ${slugify(form.restaurantName) || '—'}` : undefined}>
              <input style={styles.input} value={form.restaurantName} onChange={(e) => update('restaurantName', e.target.value)} placeholder="e.g. Kanto Cravings" />
            </Field>
            <Field label="Store Email" hint="One registration per email.">
              <input style={styles.input} type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="yourstore@up.edu.ph" autoComplete="email" />
            </Field>
            <div style={styles.threeCol}>
              <Field label="Category">
                <select style={styles.input} value={form.category} onChange={(e) => update('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Price Range">
                <select style={styles.input} value={form.priceRange} onChange={(e) => update('priceRange', e.target.value)}>
                  {PRICE_RANGES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Typical Prep + Delivery">
                <select style={styles.input} value={form.deliveryTime} onChange={(e) => update('deliveryTime', e.target.value)}>
                  {DELIVERY_TIMES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Cover Image URL (optional)" hint="Paste an image link (e.g. from Unsplash). A default photo is used if left blank.">
              <input style={styles.input} value={form.image} onChange={(e) => update('image', e.target.value)} placeholder="https://images.unsplash.com/..." />
            </Field>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.image.trim() || DEFAULT_RESTAURANT_IMAGE} alt="Cover preview" style={styles.coverPreview} />
            <label style={styles.checkboxRow}>
              <input type="checkbox" checked={form.isStudentOwned} onChange={(e) => update('isStudentOwned', e.target.checked)} />
              <span>This is a <b>student-owned</b> business (gets a badge in the app)</span>
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <h3 style={styles.sectionTitle}>Store Location</h3>
            <p style={styles.subtitle}>Riders use this pin for pickups, and buyers see the distance from their drop-off point.</p>
            <div style={styles.twoCol}>
              <Field label="Nearest Campus Landmark">
                <select style={styles.input} value={form.landmark} onChange={(e) => handleLandmarkChange(e.target.value)}>
                  <option value="">— Select a landmark —</option>
                  {CAMPUS_LOCATIONS.map((l) => <option key={l.name}>{l.name}</option>)}
                </select>
              </Field>
              <Field label="Or use your device location">
                <button type="button" style={styles.secondaryBtn} onClick={detectCurrentLocation} disabled={locating}>
                  {locating ? 'Locating…' : '📍 Use My Current Location'}
                </button>
              </Field>
            </div>
            <div style={styles.twoCol}>
              <Field label="Latitude">
                <input style={styles.input} inputMode="decimal" value={form.latitude} onChange={(e) => update('latitude', e.target.value)} placeholder="14.6538" />
              </Field>
              <Field label="Longitude">
                <input style={styles.input} inputMode="decimal" value={form.longitude} onChange={(e) => update('longitude', e.target.value)} placeholder="121.0699" />
              </Field>
            </div>

            {hasCoords ? (
              <>
                {/* OpenStreetMap embed: a free map preview with no API key. */}
                <iframe
                  title="Store location preview"
                  style={styles.map}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.004}%2C${lat - 0.003}%2C${lng + 0.004}%2C${lat + 0.003}&layer=mapnik&marker=${lat}%2C${lng}`}
                />
                {looksOffCampus && (
                  <p style={styles.warning}>⚠️ This pin looks outside UP Diliman. Double-check it before continuing.</p>
                )}
              </>
            ) : (
              <div style={styles.mapPlaceholder}>🗺️ Pick a landmark or use your location to preview the pin.</div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h3 style={styles.sectionTitle}>Review & Submit</h3>
            <p style={styles.subtitle}>Check your details. You can go back to edit anything.</p>
            <div style={styles.reviewGrid}>
              <ReviewRow label="Email" value={form.email} />
              <ReviewRow label="Restaurant" value={`${form.restaurantName}${form.isStudentOwned ? ' (student-owned)' : ''}`} />
              <ReviewRow label="Merchant ID" value={slugify(form.restaurantName)} />
              <ReviewRow label="Category" value={`${form.category} · ${form.priceRange} · ${form.deliveryTime}`} />
              <ReviewRow label="Landmark" value={form.landmark || '—'} />
              <ReviewRow label="Coordinates" value={`${form.latitude}, ${form.longitude}`} />
            </div>
          </>
        )}

        {error && <p style={styles.error} role="alert">{error}</p>}

        <div style={styles.actions}>
          {step > 0 ? (
            <button type="button" style={styles.backBtn} onClick={goBack} disabled={submitting}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          <button type="submit" style={{ ...styles.primaryBtn, ...(submitting ? { opacity: 0.7 } : {}) }} disabled={submitting}>
            {isLastStep ? (submitting ? 'Registering…' : 'Register Restaurant ✓') : 'Next →'}
          </button>
        </div>
      </form>

      <p style={styles.footerNote}>
        Already registered? <Link href="/" style={{ color: UP_MAROON, fontWeight: 600 }}>Sign in to the Merchant Portal</Link>
      </p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      {children}
      {hint && <span style={styles.hint}>{hint}</span>}
    </label>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <span style={styles.reviewLabel}>{label}</span>
      <span style={styles.reviewValue}>{value}</span>
    </>
  );
}

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#F8F9FA', padding: '0 0 40px' } as React.CSSProperties,
  // Header styles copied from components/Navbar.tsx so both pages share one look.
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: UP_MAROON,
    padding: '14px 28px',
    gap: 12,
    color: '#FFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  } as React.CSSProperties,
  brandContainer: { display: 'flex', alignItems: 'center', gap: 12 },
  logoIcon: { fontSize: 28, whiteSpace: 'nowrap' } as React.CSSProperties,
  brandTitle: { margin: 0, fontSize: 18, fontWeight: 'bold' },
  partnerBadge: { fontSize: 11, backgroundColor: '#F4A261', color: '#111', padding: '2px 6px', borderRadius: 4, fontWeight: '600' },
  headerLink: {
    border: '1px solid #FAD2D2',
    color: '#FFF',
    padding: '6px 12px',
    borderRadius: 8,
    fontWeight: '600',
    fontSize: 14,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  stepper: {
    display: 'flex',
    justifyContent: 'center',
    gap: 28,
    listStyle: 'none',
    padding: 0,
    margin: '0 auto 20px',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  stepItem: { display: 'flex', alignItems: 'center', gap: 8 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  } as React.CSSProperties,
  stepDotActive: { backgroundColor: UP_MAROON, color: '#FFF' },
  stepDotDone: { backgroundColor: '#2D6A4F', color: '#FFF' },
  stepLabel: { fontSize: 13, color: '#6B7280' },
  intro: { maxWidth: 720, margin: '28px auto 20px', padding: '0 16px', boxSizing: 'border-box' } as React.CSSProperties,
  card: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 12,
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    border: '1px solid #EEE',
    maxWidth: 720,
    margin: '0 auto',
    boxSizing: 'border-box',
    width: 'calc(100% - 24px)',
  } as React.CSSProperties,
  sectionTitle: { margin: '0 0 4px', color: '#222' },
  subtitle: { color: '#666', marginTop: 0, marginBottom: 20, fontSize: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, flex: 1 } as React.CSSProperties,
  label: { fontSize: 13, fontWeight: 600, color: '#374151' },
  hint: { fontSize: 12, color: '#888' },
  input: {
    padding: 10,
    borderRadius: 8,
    border: '1px solid #CCC',
    fontSize: 14,
    backgroundColor: '#FFF',
    width: '100%',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 },
  threeCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
  coverPreview: { width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 14, border: '1px solid #EEE' } as React.CSSProperties,
  checkboxRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#333', cursor: 'pointer' },
  map: { width: '100%', height: 260, border: '1px solid #E5E7EB', borderRadius: 10 },
  mapPlaceholder: {
    height: 160,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  } as React.CSSProperties,
  warning: { backgroundColor: '#FEF3C7', color: '#92400E', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginTop: 10 },
  reviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(90px, max-content) 1fr',
    rowGap: 10,
    columnGap: 12,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 10,
    fontSize: 14,
  } as React.CSSProperties,
  reviewLabel: { color: '#6B7280', fontWeight: 600 },
  reviewValue: { color: '#111', wordBreak: 'break-word' } as React.CSSProperties,
  error: { backgroundColor: '#FDE2E2', color: '#C53030', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginTop: 16, marginBottom: 0 },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  primaryBtn: {
    backgroundColor: UP_MAROON,
    color: '#FFF',
    border: 'none',
    padding: '10px 22px',
    borderRadius: 8,
    fontWeight: 'bold',
    fontSize: 14,
    cursor: 'pointer',
  } as React.CSSProperties,
  secondaryBtn: {
    backgroundColor: '#FFF',
    color: UP_MAROON,
    border: `1px solid ${UP_MAROON}`,
    padding: 10,
    borderRadius: 8,
    fontWeight: 'bold',
    fontSize: 14,
    cursor: 'pointer',
  } as React.CSSProperties,
  backBtn: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    border: 'none',
    padding: '10px 18px',
    borderRadius: 8,
    fontWeight: 'bold',
    fontSize: 14,
    cursor: 'pointer',
  } as React.CSSProperties,
  idBox: { fontSize: 16, fontWeight: 600, color: '#222', margin: '0 0 20px' },
  code: { backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: 4 },
  footerNote: { textAlign: 'center', fontSize: 13, color: '#666', marginTop: 18 } as React.CSSProperties,
};
