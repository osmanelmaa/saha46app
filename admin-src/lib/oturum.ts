'use client';

/**
 * Sahte oturum.
 *
 * Gerçek kimlik doğrulama YOKTUR. Giriş ekranı herhangi bir değeri kabul eder
 * ve tarayıcı sekmesine bir bayrak yazar. Bu, paneli gezerken gerçek akışı
 * göstermek içindir; hiçbir güvenlik değeri taşımaz.
 */

const ANAHTAR = 'saha46-admin-demo-oturum';

export function girisYap(eposta: string) {
  try {
    sessionStorage.setItem(ANAHTAR, eposta);
  } catch {
    // Gizli sekmede depolama kapalı olabilir; panel yine de açılır.
  }
}

export function cikisYap() {
  try {
    sessionStorage.removeItem(ANAHTAR);
  } catch {
    /* yoksay */
  }
}

export function oturumVar(): boolean {
  try {
    return Boolean(sessionStorage.getItem(ANAHTAR));
  } catch {
    return true;
  }
}

export function oturumEpostasi(): string {
  try {
    return sessionStorage.getItem(ANAHTAR) ?? '';
  } catch {
    return '';
  }
}
