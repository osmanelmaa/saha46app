// next build ciktisini (out/) sitenin kokundeki admin/ klasorune tasir.
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const buraya = dirname(fileURLToPath(import.meta.url));
const kaynak = join(buraya, '..', 'out');
const hedef = join(buraya, '..', '..', 'admin');

if (!existsSync(kaynak)) {
  console.error('out/ bulunamadi. Once "npm run build" calistirin.');
  process.exit(1);
}
await rm(hedef, { recursive: true, force: true });
await mkdir(hedef, { recursive: true });
await cp(kaynak, hedef, { recursive: true });
console.log('Panel kopyalandi ->', hedef);
