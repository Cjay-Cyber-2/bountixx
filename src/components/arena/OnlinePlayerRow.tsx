"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

const RANK_COLORS: Record<string, string> = {
  LEGENDARY: "#FF6B1A",
  CHAMPION: "#F0A500",
  ELITE: "#00D68F",
  CHALLENGER: "#9B6BFF",
  RECRUIT: "var(--haze-3)",
};

export type OnlinePlayer = {
  id: string;
  username: string;
  rank: string;
  avatarUrl: string | null;
  initials: string;
};

type OnlinePlayerRowProps = {
  player: OnlinePlayer;
  action?: React.ReactNode;
  online?: boolean;
};

export function OnlinePlayerRow({ player, action, online }: OnlinePlayerRowProps) {
  const color = RANK_COLORS[player.rank] ?? "var(--haze-3)";

  return (
    <div className="flex items-center gap-3 group py-2">
      <div className="relative shrink-0">
        <div
          className="w-9 h-9 rounded-full bg-cosmos-3 border-2 flex items-center justify-center overflow-hidden"
          style={{ borderColor: `${color}44` }}
        >
          {player.avatarUrl ? (
            <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
          ) : (
            <span className="font-orbitron font-bold text-[10px] text-haze">{player.initials}</span>
          )}
        </div>
        {online !== undefined && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-cosmos-2 ${
              online ? "bg-success" : "bg-haze-3"
            }`}
            aria-hidden
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-rajdhani font-semibold text-sm text-haze leading-tight truncate">
          @{player.username}
        </p>
        <p className="font-space-mono text-[10px] mt-1" style={{ color }}>
          {player.rank}
          {online === false ? " · offline" : online ? " · online" : ""}
        </p>
      </div>
      {action}
    </div>
  );
}

type InviteButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  invited?: boolean;
  onClick: () => void;
};

export function InvitePlayerButton({ disabled, loading, invited, onClick }: InviteButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`cursor-target shrink-0 font-space-mono text-[10px] px-3 py-1 transition-all disabled:opacity-50 ${
        invited
          ? "text-success"
          : "text-haze-3 sm:opacity-0 sm:group-hover:opacity-100 hover:text-void"
      }`}
      style={{
        border: invited ? "1px solid rgba(0,214,143,0.4)" : "1px solid var(--border-1)",
        background: invited ? "rgba(0,214,143,0.08)" : "transparent",
      }}
    >
      {invited ? "Sent ✓" : loading ? "Sending…" : "Invite"}
    </button>
  );
}

export function LobbyInviteButton({ disabled, loading, invited, onClick }: InviteButtonProps) {
  if (invited) {
    return <span className="text-xs text-haze-3 px-2 font-space-mono">Invited</span>;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className="gap-1.5"
      disabled={disabled || loading}
      onClick={onClick}
    >
      <UserPlus className="h-3.5 w-3.5" />
      {loading ? "Sending…" : "Invite"}
    </Button>
  );
}
