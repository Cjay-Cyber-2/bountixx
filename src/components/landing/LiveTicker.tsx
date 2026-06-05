const ROW_1 =
  "🏆 @zainab_codes just won 450 coins in String Reversal Clash · ⚡ Arena LIVE: Math Puzzle Rush · 5 players waiting · 🎖 @dev_tolu reached Elite rank · 💰 4,200 coins awarded today · 🔥 New arena: Sorting Algorithm Sprint ·";

const ROW_2 =
  "🔒 Trivia Showdown just locked · 8/8 players · ⚡ New arena: JavaScript Battle · 🏆 @code_chief just scored 100% · 💎 @ade_x reached Champion rank · ⚡ Arena: Regex Warfare — join now ·";

function TickerRow({ content, reverse = false }: { content: string; reverse?: boolean }) {
  const doubled = `${content} ${content}`;
  return (
    <div className="overflow-hidden flex items-center h-[26px]">
      <span
        className={`inline-block whitespace-nowrap font-share-mono text-xs text-haze-2 ${
          reverse ? "ticker-rtl" : "ticker-ltr"
        }`}
      >
        {doubled}
      </span>
    </div>
  );
}

export function LiveTicker() {
  return (
    <div className="w-full bg-cosmos-2 border-y border-cosmos-4 py-3 flex flex-col gap-1.5 overflow-hidden">
      <TickerRow content={ROW_1} />
      <TickerRow content={ROW_2} reverse />
    </div>
  );
}
