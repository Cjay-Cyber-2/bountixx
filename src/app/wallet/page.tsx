"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { CrownMark } from "@/components/BountixxLogo";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useToast } from "@/components/ui/Toast";
import { AppPage } from "@/components/landing/_section";

type FilterTab = "ALL" | "EARNED" | "SPENT" | "PURCHASED";
type PaymentMethod = "paystack" | "stripe";
type Transaction = { type: string; desc: string; amount: number; date: string };

const TX_LABELS: Record<string, string> = {
  earned: "Bounty won",
  spent: "Arena created",
  purchased: "Coins purchased",
  refund: "Refund",
  bonus: "Bonus reward",
  gifted: "Coins gifted",
};

function describeTransaction(reference: string | undefined, type: string): string {
  const ref = reference?.trim() ?? "";
  if (ref.includes(":no_winner_refund")) return "Entry fee returned — no winner";
  if (ref.includes(":cancelled_refund")) return "Entry fee returned — arena cancelled";
  if (ref.includes(":tie_refund")) return "Entry fee returned — tie";
  if (ref.includes(":entry")) return "Arena entry fee";
  if (ref.includes(":winner")) return "Bounty won";
  if (ref) return ref;
  return TX_LABELS[type] ?? type;
}

const BUNDLES = [
  { id: "starter",    label: "Starter",    coins: 100,  priceNGN: "₦750",    priceUSD: "$0.99",  popular: false },
  { id: "challenger", label: "Challenger", coins: 300,  priceNGN: "₦2,000",  priceUSD: "$2.49",  popular: false },
  { id: "elite",      label: "Elite",      coins: 750,  priceNGN: "₦4,000",  priceUSD: "$4.99",  popular: true  },
  { id: "champion",   label: "Champion",   coins: 2000, priceNGN: "₦9,500",  priceUSD: "$11.99", popular: false },
  { id: "legendary",  label: "Legendary",  coins: 5500, priceNGN: "₦25,000", priceUSD: "$27.99", popular: false },
];

export default function WalletPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterTab>("ALL");
  const [selected, setSelected] = useState(2);
  const [balance, setBalance] = useState(0);
  const [txList, setTxList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchWithAuth("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        if (d.balance !== undefined) setBalance(d.balance);
        if (Array.isArray(d.transactions)) {
          setTxList(
            d.transactions.map((t: { type: string; reference?: string; amount: number; createdAt: string }) => ({
              type: t.type,
              desc: describeTransaction(t.reference, t.type),
              amount: t.amount,
              date: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? txList : txList.filter((t) => t.type === filter.toLowerCase());

  async function handlePayment() {
    const bundle = BUNDLES[selected];
    setPaying(true);

    try {
      if (paymentMethod === "paystack") {
        const res = await fetchWithAuth("/api/payment/paystack/initialize", {
          method: "POST",
          body: JSON.stringify({ bundleId: bundle.id }),
        });
        const data = await res.json() as { authorizationUrl?: string; error?: string };
        if (data.authorizationUrl) {
          window.location.href = data.authorizationUrl;
        } else {
          toast({ type: "error", title: "Payment failed", message: data.error ?? "Could not start the Paystack checkout." });
          setPaying(false);
        }
      } else {
        const res = await fetchWithAuth("/api/payment/stripe/checkout", {
          method: "POST",
          body: JSON.stringify({ bundleId: bundle.id }),
        });
        const data = await res.json() as { url?: string; error?: string };
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast({ type: "error", title: "Checkout failed", message: data.error ?? "Could not start the Stripe checkout." });
          setPaying(false);
        }
      }
    } catch {
      toast({ type: "error", title: "Network error", message: "Please check your connection and try again." });
      setPaying(false);
    }
  }

  const selectedBundle = BUNDLES[selected];
  const displayPrice = paymentMethod === "paystack" ? selectedBundle.priceNGN : selectedBundle.priceUSD;

  return (
    <AppLayout>
      <AppPage>
        <p className="font-mono text-[11px] text-[var(--brand-primary)] tracking-[3px] uppercase mb-3">Treasury</p>
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-haze mb-10 md:mb-12 leading-[1.1]">Your wallet</h1>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] gap-8 md:gap-10 xl:gap-14 w-full">
          {/* Left */}
          <div className="flex flex-col gap-8 md:gap-10 min-w-0">
            {/* Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-2xl p-7 md:p-10 flex items-center gap-6 md:gap-8 overflow-hidden shadow-sm"
              style={{
                background: "linear-gradient(135deg, rgba(240,165,0,0.08), rgba(240,165,0,0.02))",
                border: "1px solid rgba(240,165,0,0.32)",
              }}
            >
              <div
                className="absolute -top-12 -right-12 w-52 h-52 rounded-full opacity-50 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(240,165,0,0.35), transparent 70%)" }}
                aria-hidden
              />
              <div className="shrink-0" style={{ filter: "drop-shadow(0 0 18px rgba(240,165,0,0.4))" }}>
                <CrownMark size={64} crownColor="#F0A500" crownLight="#FFC94D" dotColor="#7C5CFF" id="wallet-balance" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] md:text-xs text-haze-3 tracking-[2px] mb-2 uppercase">Bountixx coins</p>
                <AnimatedNumber
                  value={balance}
                  className="font-stats font-black text-4xl sm:text-5xl md:text-6xl text-coin-gold block leading-none"
                />
              </div>
            </motion.div>

            {/* Filter tabs */}
            <div className="flex gap-1 border-b border-[var(--border-1)] overflow-x-auto -mx-1 px-1">
              {(["ALL", "EARNED", "SPENT", "PURCHASED"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`cursor-target px-5 py-3 font-mono text-[11px] md:text-xs tracking-[2px] border-b-2 transition-all whitespace-nowrap ${
                    filter === tab
                      ? "border-[var(--brand-primary)] text-[var(--brand-primary)]"
                      : "border-transparent text-haze-3 hover:text-haze-2"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Transactions */}
            <div className="rounded-2xl overflow-hidden border border-[var(--border-1)]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 md:px-7 py-4 bg-[var(--surface-inset)] border-b border-[var(--border-1)] last:border-0">
                    <div className="w-9 h-9 shrink-0 bg-cosmos-3 animate-pulse rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 w-40 bg-cosmos-3 animate-pulse rounded mb-2" />
                      <div className="h-2.5 w-20 bg-cosmos-3 animate-pulse rounded" />
                    </div>
                    <div className="h-4 w-12 bg-cosmos-3 animate-pulse rounded" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center bg-[var(--surface-inset)]">
                  <p className="font-display text-lg text-haze mb-2">No transactions yet</p>
                  <p className="font-body text-sm text-haze-3">Win arenas or buy coins to get started.</p>
                </div>
              ) : (
                filtered.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-5 md:px-7 py-4 bg-[var(--surface-inset)] border-b border-[var(--border-1)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors"
                  >
                    <div
                      className="w-9 h-9 flex items-center justify-center shrink-0 rounded-lg"
                      style={{
                        background: t.amount > 0 ? "rgba(110,231,183,0.14)" : "rgba(251,113,133,0.14)",
                      }}
                    >
                      {t.amount > 0 ? (
                        <Plus size={16} className="text-success" aria-hidden />
                      ) : (
                        <Minus size={16} className="text-danger" aria-hidden />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm md:text-base text-haze truncate">{t.desc}</p>
                      <p className="font-mono text-[10px] text-haze-3 mt-1 sm:hidden">{t.date}</p>
                    </div>
                    <span
                      className="font-stats font-bold text-sm md:text-base shrink-0"
                      style={{ color: t.amount > 0 ? "var(--success)" : t.amount === 0 ? "var(--haze-3)" : "var(--danger)" }}
                    >
                      {t.amount > 0 ? `+${t.amount}` : t.amount === 0 ? "FREE" : t.amount}
                    </span>
                    <span className="hidden sm:inline font-mono text-[10px] text-haze-3 shrink-0 w-14 text-right">{t.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: bundles */}
          <div className="flex flex-col gap-4">
            <div className="mb-2">
              <p className="font-mono text-[11px] text-haze-3 tracking-[2px] mb-2 uppercase">Top up</p>
              <h2 className="font-display text-2xl md:text-3xl text-haze">Buy coins</h2>
            </div>

            {BUNDLES.map((b, i) => (
              <button
                key={b.label}
                onClick={() => setSelected(i)}
                className={`cursor-target relative text-left p-5 md:p-6 border rounded-xl transition-all hover:-translate-y-0.5 ${
                  selected === i
                    ? "border-[var(--brand-primary)] bg-[var(--void-tint)] shadow-sm"
                    : "border-[var(--border-1)] bg-[var(--surface-inset)] hover:border-[var(--border-accent)]"
                }`}
              >
                {b.popular && (
                  <span
                    className="absolute top-3 right-3 font-mono text-[9px] px-2 py-0.5 rounded tracking-[1px] uppercase"
                    style={{ background: "var(--brand-primary)", color: "#FFFFFF" }}
                  >
                    POPULAR
                  </span>
                )}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-stats font-bold text-3xl text-coin-gold leading-none">{b.coins.toLocaleString()}</p>
                    <p className="font-mono text-[10px] text-haze-3 mt-2 uppercase tracking-wider">{b.label}</p>
                  </div>
                  <p className="font-display text-xl md:text-2xl text-haze shrink-0">
                    {paymentMethod === "paystack" ? b.priceNGN : b.priceUSD}
                  </p>
                </div>
              </button>
            ))}

            {/* Payment method toggle */}
            <div className="flex border border-[var(--border-1)] rounded-xl overflow-hidden mt-2">
              <button
                onClick={() => setPaymentMethod("paystack")}
                className={`flex-1 py-2.5 font-mono text-[11px] tracking-[1px] transition-all ${
                  paymentMethod === "paystack"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-haze-3 hover:text-haze-2 hover:bg-[var(--surface-hover)]"
                }`}
              >
                NGN · Paystack
              </button>
              <button
                onClick={() => setPaymentMethod("stripe")}
                className={`flex-1 py-2.5 font-mono text-[11px] tracking-[1px] transition-all ${
                  paymentMethod === "stripe"
                    ? "bg-[var(--brand-primary)] text-white"
                    : "text-haze-3 hover:text-haze-2 hover:bg-[var(--surface-hover)]"
                }`}
              >
                USD · Stripe
              </button>
            </div>

            <Button
              variant="primary"
              fullWidth
              size="lg"
              magnetic
              onClick={handlePayment}
              disabled={paying}
              className="mt-2"
            >
              <ShoppingBag size={18} aria-hidden />
              {paying ? "REDIRECTING…" : `PAY ${displayPrice}`}
            </Button>
            <p className="font-mono text-[10px] text-haze-3 text-center tracking-wider leading-relaxed">
              Secure checkout · Coins are non-refundable · Not redeemable for cash
            </p>
          </div>
        </div>
      </AppPage>
    </AppLayout>
  );
}
