import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { generatedRoutes } from './generated/registry';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function GeneratedGallery() {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return generatedRoutes;
    return generatedRoutes.filter(
      (r) => r.title.toLowerCase().includes(term) || r.slug.includes(term),
    );
  }, [q]);

  return (
    <div className="container py-10">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Generated Screen Gallery</h1>
          <Badge variant="outline" className="border-amber-500/40 text-amber-300">Experimental inventory</Badge>
        </div>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          {generatedRoutes.length} generated screen files are preserved as an inventory and are reachable below.
          They are draft UI experiments rendered with sample or stub data, have no production-readiness claim,
          and are isolated from the validated core product. A screen must receive a real contract, tests, and
          data-source verification before it can be promoted to a canonical product route.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Badge variant="secondary">{filtered.length} shown</Badge>
          <Input
            placeholder="Search screens..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((r) => (
          <Link key={r.slug} href={`/g/${r.slug}`}>
            <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/40">
              <CardHeader>
                <CardTitle className="text-base truncate">{r.title}</CardTitle>
                <code className="text-xs text-muted-foreground">/g/{r.slug}</code>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          No screens match &ldquo;{q}&rdquo;.
        </div>
      )}
    </div>
  );
}
