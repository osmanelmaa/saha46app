'use client';

/**
 * Supabase istemcisi — yalnızca tarayıcıda çalışır.
 *
 * Kullanılan anahtar **anon public** anahtardır; tarayıcıya gömülmesi
 * tasarım gereğidir ve satır düzeyi güvenlik (RLS) tarafından korunur.
 * `service_role` anahtarı buraya ya da başka bir istemciye ASLA konmaz;
 * RLS'i tamamen atlar.
 *
 * Değerler derleme sırasında `admin-src/.env.local` dosyasından okunur:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 * Kaynakları mobil depodaki eas.json içindeki EXPO_PUBLIC_* değerleridir;
 * iki taraf aynı projeye bağlanır.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anahtar = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Ortam değişkenleri tanımlı mı? Değilse panel demo kipinde çalışır. */
export const supabaseHazir = Boolean(url && anahtar);

export const supabase = supabaseHazir
  ? createClient(url!, anahtar!, {
      auth: {
        // Panel statik dosya olarak sunulur; oturum tarayıcıda saklanır.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/** profiles tablosundan okunan, panelin ilgilendiği alanlar. */
export type YoneticiProfili = {
  id: string;
  name: string;
  email: string | null;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
};
