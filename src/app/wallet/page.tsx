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

// Maps a raw transaction type to a readable label when no reference is stored.
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
        <p className="font-space-mono text-[11px] text-plum tracking-[3px] uppercase mb-2">Treasury</p>
        <h1 className="font-zen-dots text-2xl md:text-3xl text-haze mb-8">Your wallet</h1>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] gap-6 xl:gap-10 w-full">
          {/* Left */}
          <div className="flex flex-col gap-6">
            {/* Balance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-6 md:p-8 flex items-center gap-5 md:gap-6 clip-arena overflow-hidden"
              style={{ background: "rgba(240,165,0,0.05)", border: "1px solid rgba(240,165,0,0.3)" }}
            >
              <div
                className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-40 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(240,165,0,0.35), transparent 70%)" }}
                aria-hidden
              />
              <div className="shrink-0" style={{ filter: "drop-shadow(0 0 16px rgba(240,165,0,0.4))" }}>
                <CrownMark size={64} crownColor="#F0A500" crownLight="#FFC94D" dotColor="#111B56" id="wallet-balance" />
              </div>
              <div>
                <p className="font-space-mono text-[10px] text-haze-3 tracking-[2px] mb-1 uppercase">Bountixx coins</p>
                <AnimatedNumber value={balance} className="font-orbitron font-black text-5xl md:text-6xl text-coin-gold block leading-none" />
              </div>
            </motion.div>

            {/* Filter tabs */}
            <div className="flex gap-1 border-b border-cosmos-4 overflow-x-auto">
              {(["ALL", "EARNED", "SPENT", "PURCHASED"] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`cursor-target px-4 py-3 font-space-mono text-[10px] tracking-[2px] border-b-2 transition-all whitespace-nowrap ${
                    filter === tab ? "border-void text-void" : "border-transparent text-haze-3 hover:text-haze-2"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Transactions */}
            <div className="clip-arena overflow-hidden" style={{ border: "1px solid rgba(45,27,105,0.7)" }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3.5 px-4 md:px-5 py-3.5 bg-cosmos-2 border-b border-cosmos-4 last:border-0">
                    <div className="w-8 h-8 shrink-0 bg-cosmos-3 animate-pulse clip-arena-sm" />
                    <div className="flex-1">
                      <div className="h-3.5 w-40 bg-cosmos-3 animate-pulse mb-1.5" />
                      <div className="h-2.5 w-20 bg-cosmos-3 animate-pulse" />
                    </div>
                    <div className="h-4 w-12 bg-cosmos-3 animate-pulse" />
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="p-10 text-center bg-cosmos-2">
                  <p className="font-rajdhani font-bold text-lg text-haze-2">No transactions yet</p>
                  <p className="font-rajdhani text-sm text-haze-3 mt-1">Win arenas or buy coins to get started.</p>
                </div>
              ) : (
                filtered.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 px-4 md:px-5 py-3.5 bg-cosmos-2 border-b border-cosmos-4 last:border-0 hover:bg-cosmos-3 transition-colors"
                  >
                    <div
                      className="w-8 h-8 flex items-center justify-center shrink-0 clip-arena-sm"
                      style={{ background: t.amount > 0 ? "rgba(0,214,143,0.12)" : "rgba(255,45,85,0.12)" }}
                    >
                      {t.amount > 0 ? (
                        <Plus size={14} className="text-success" aria-hidden />
                      ) : (
                        <Minus size={14} className="text-danger" aria-hidden />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-rajdhani font-semibold text-sm text-haze truncate">{t.desc}</p>
                      <p className="font-space-mono text-[10px] text-haze-3 mt-0.5 sm:hidden">{t.date}</p>
                    </div>
                    <span
                      className="font-orbitron font-bold text-sm shrink-0"
                      style={{ color: t.amount > 0 ? "#00D68F" : t.amount === 0 ? "var(--haze-3)" : "#FF2D55" }}
                    >
                      {t.amount > 0 ? `+${t.amount}` : t.amount === 0 ? "FREE" : t.amount}
                    </span>
                    <span className="hidden sm:inline font-space-mono text-[10px] text-haze-3 shrink-0 w-12 text-right">{t.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: bundles */}
          <div className="flex flex-col gap-3">
            <div className="mb-1">
              <p className="font-space-mono text-[10px] text-haze-3 tracking-[2px] mb-1 uppercase">Top up</p>
              <h2 className="font-zen-dots text-xl text-haze">Buy coins</h2>
            </div>

            {BUNDLES.map((b, i) => (
              <button
                key={b.label}
                onClick={() => setSelected(i)}
                className={`cursor-target relative text-left p-4 border transition-all hover:-translate-y-0.5 clip-arena-sm ${
                  selected === i ? "border-void bg-void/10" : "border-cosmos-4 bg-cosmos-2 hover:border-void/50"
                }`}
              >
                {b.popular && (
                  <span className="absolute top-2 right-2 font-space-mono text-[8px] text-cosmos bg-void px-2 py-0.5 tracking-[1px]">
                    POPULAR
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-orbitron font-bold text-2xl text-coin-gold leading-none">{b.coins.toLocaleString()}</p>
                    <p className="font-space-mono text-[9px] text-haze-3 mt-1.5 uppercase tracking-wider">{b.label}</p>
                  </div>
                  <p className="font-rajdhani font-bold text-xl text-haze">
                    {paymentMethod === "paystack" ? b.priceNGN : b.priceUSD}
                  </p>
                </div>
              </button>
            ))}

            {/* Payment method toggle */}
            <div className="flex border border-cosmos-4 mt-1">
              <button
                onClick={() => setPaymentMethod("paystack")}
                className={`flex-1 py-2 font-space-mono text-[10px] tracking-[1px] transition-all ${
                  paymentMethod === "paystack"
                    ? "bg-void text-cosmos"
                    : "text-haze-3 hover:text-haze-2 hover:bg-cosmos-3"
                }`}
              >
                NGN · Paystack
              </button>
              <button
                onClick={() => setPaymentMethod("stripe")}
                className={`flex-1 py-2 font-space-mono text-[10px] tracking-[1px] transition-all ${
                  paymentMethod === "stripe"
                    ? "bg-void text-cosmos"
                    : "text-haze-3 hover:text-haze-2 hover:bg-cosmos-3"
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
              className="mt-1"
            >
              <ShoppingBag size={16} aria-hidden />
              {paying ? "REDIRECTING…" : `PAY ${displayPrice}`}
            </Button>
            <p className="font-space-mono text-[9px] text-haze-3 text-center tracking-wider leading-relaxed">
              Secure checkout · Coins are non-refundable · Not redeemable for cash
            </p>
          </div>
        </div>
      </AppPage>
    </AppLayout>
  );
}
