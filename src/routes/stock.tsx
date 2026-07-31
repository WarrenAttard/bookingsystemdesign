import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/stock")({
  head: () => ({
    meta: [
      { title: "Stock — Pawline" },
      { name: "description", content: "Retail and internal-use stock with movement ledger." },
      { property: "og:title", content: "Stock — Pawline" },
      { property: "og:description", content: "Product catalogue, low-stock alerts and special orders." },
    ],
  }),
  component: StockPage,
});

const products = [
  { name: "Oat Shampoo 500ml", cat: "Internal", stock: 3, threshold: 6, price: "€8.90", tone: "low" },
  { name: "Deshedding Comb", cat: "Retail", stock: 12, threshold: 4, price: "€14.00", tone: "ok" },
  { name: "Salmon Treats 200g", cat: "Retail", stock: 0, threshold: 5, price: "€6.50", tone: "out" },
  { name: "Conditioner Spray", cat: "Internal", stock: 8, threshold: 4, price: "€11.00", tone: "ok" },
  { name: "Ear Cleaner Solution", cat: "Internal", stock: 2, threshold: 5, price: "€9.00", tone: "low" },
  { name: "Puppy Shampoo 250ml", cat: "Retail", stock: 6, threshold: 3, price: "€7.20", tone: "ok" },
];

const toneBadge: Record<string, string> = {
  ok: "bg-primary/12 text-primary",
  low: "bg-accent/12 text-accent",
  out: "bg-destructive/12 text-destructive",
};

function StockPage() {
  return (
    <AppShell
      title="Stock"
      subtitle="1 out, 2 low, 3 healthy"
      actions={
        <button className="h-10 px-5 rounded-2xl bg-accent text-accent-foreground text-sm font-bold flex items-center gap-2 shadow-sm">
          <Plus className="size-4" /> New receipt
        </button>
      }
    >
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-10 pb-6 lg:pb-10">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <SummaryCard label="Retail products" value="14" hint="€1,240 on shelf" />
          <SummaryCard label="Internal supplies" value="9" hint="Est. 3 weeks cover" />
          <SummaryCard label="Special orders" value="4" hint="1 ready for collection" tone="accent" />
        </div>

        <div className="bg-card rounded-3xl ring-1 ring-black/5 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">Catalogue</h3>
            <div className="flex items-center gap-2 text-xs">
              <button className="px-3 h-8 rounded-lg bg-secondary text-ink font-semibold">All</button>
              <button className="px-3 h-8 rounded-lg text-ink-muted font-semibold">Retail</button>
              <button className="px-3 h-8 rounded-lg text-ink-muted font-semibold">Internal</button>
              <button className="px-3 h-8 rounded-lg text-ink-muted font-semibold">Low stock</button>
            </div>
          </div>

          <div className="divide-y divide-border">
            <div className="grid grid-cols-[2fr_100px_120px_120px_100px_100px] px-6 py-2 text-[10px] uppercase tracking-widest text-ink-muted font-bold">
              <span>Product</span>
              <span>Category</span>
              <span className="text-right">On hand</span>
              <span className="text-right">Threshold</span>
              <span className="text-right">Retail</span>
              <span className="text-right">Status</span>
            </div>
            {products.map((p) => (
              <div key={p.name} className="grid grid-cols-[2fr_100px_120px_120px_100px_100px] px-6 py-3 items-center text-sm">
                <div>
                  <p className="font-semibold text-ink">{p.name}</p>
                  <p className="text-xs text-ink-muted">SKU · PW-{p.name.length}0{p.stock}</p>
                </div>
                <span className="text-xs text-ink-muted">{p.cat}</span>
                <span className="text-right font-mono text-ink">{p.stock}</span>
                <span className="text-right font-mono text-ink-muted">{p.threshold}</span>
                <span className="text-right font-mono text-ink">{p.price}</span>
                <div className="text-right">
                  <span className={"text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md " + toneBadge[p.tone]}>
                    {p.tone === "ok" ? "In stock" : p.tone === "low" ? "Low" : "Out"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Movement ledger preview */}
        <div className="mt-6 bg-card rounded-3xl ring-1 ring-black/5 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-muted">Movement ledger</h3>
              <p className="text-sm text-ink mt-1">Oat Shampoo 500ml · current derived stock <span className="font-mono font-bold">3</span></p>
            </div>
            <button className="text-xs font-semibold text-primary hover:underline">Full ledger →</button>
          </div>
          <ul className="divide-y divide-border">
            {[
              { d: "Oct 22", t: "Use", q: "−1", who: "Alex S. · Coco groom", bal: 3 },
              { d: "Oct 20", t: "Use", q: "−1", who: "Maria R. · Bear groom", bal: 4 },
              { d: "Oct 18", t: "Receipt", q: "+6", who: "Supplier PawSupply", bal: 5, pos: true },
              { d: "Oct 12", t: "Correction", q: "−1", who: "Admin · miscount", bal: -1, warn: true },
              { d: "Oct 04", t: "Use", q: "−1", who: "Jonas T. · Daisy groom", bal: 0 },
            ].map((m, i) => (
              <li key={i} className="grid grid-cols-[70px_100px_80px_1fr_80px] items-center py-3 text-sm">
                <span className="font-mono text-xs text-ink-muted">{m.d}</span>
                <span className="text-ink font-medium">{m.t}</span>
                <span className={"font-mono font-bold " + (m.pos ? "text-primary" : m.warn ? "text-accent" : "text-ink-muted")}>{m.q}</span>
                <span className="text-xs text-ink-muted">{m.who}</span>
                <span className="text-right text-xs text-ink-muted">bal.</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryCard({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: "accent" }) {
  return (
    <div className={"rounded-3xl p-5 shadow-sm ring-1 ring-black/5 " + (tone === "accent" ? "bg-accent/10" : "bg-card")}>
      <p className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</p>
      <p className={"text-3xl font-mono font-medium mt-2 leading-none " + (tone === "accent" ? "text-accent" : "text-ink")}>{value}</p>
      <p className="text-[11px] text-ink-muted mt-2">{hint}</p>
    </div>
  );
}
