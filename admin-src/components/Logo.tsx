'use client';

/**
 * Saha46 logosu.
 *
 * basePath /admin olduğu için kaynak yolu elle yazılır; next/image
 * statik dışa aktarımda gereksiz karmaşa getirdiğinden düz <img> kullanılır.
 */

export function Logo({ boyut = 34, yuvarlak = 10 }: { boyut?: number; yuvarlak?: number }) {
  return (
    <img
      src="/admin/logo.png"
      width={boyut}
      height={boyut}
      alt="Saha46"
      style={{ borderRadius: yuvarlak, display: 'block', flex: 'none' }}
    />
  );
}
