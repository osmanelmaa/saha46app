import { KayitDetay } from '@/components/KayitDetay';
import { profiller, takimlar } from '@/lib/mock/veri';

/**
 * Statik dışa aktarım için tüm detay sayfaları derleme sırasında üretilir.
 * Kullanıcılar "p3", takımlar "takim-t3" biçiminde adreslenir.
 */
export function generateStaticParams() {
  return [
    ...profiller.map((p) => ({ id: p.id })),
    ...takimlar.map((t) => ({ id: `takim-${t.id}` })),
  ];
}

export default async function DetaySayfasi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KayitDetay kimlik={id} />;
}
