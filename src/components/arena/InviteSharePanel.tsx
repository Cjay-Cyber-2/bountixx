"use client";

import { useCallback, useState } from "react";
import { Check, Copy, QrCode, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { buildInviteLink } from "@/lib/appUrl";

type InviteSharePanelProps = {
  roomId: string;
  /** QR size in px — lobby uses slightly smaller on mobile */
  qrSize?: number;
  className?: string;
};

export function InviteSharePanel({
  roomId,
  qrSize = 128,
  className = "",
}: InviteSharePanelProps) {
  const inviteLink = buildInviteLink(roomId);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState("");

  const copyLink = useCallback(async () => {
    setShareError("");
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError("Could not copy — select the link and copy manually.");
    }
  }, [inviteLink]);

  const shareLink = useCallback(async () => {
    setShareError("");
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Join my Bountixx arena",
          text: "Scan or open this link to join my arena lobby.",
          url: inviteLink,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
      }
    }
    await copyLink();
  }, [copyLink, inviteLink]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-5 sm:items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-stretch gap-0 border border-cosmos-4">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 min-w-0 h-11 px-3 bg-cosmos-2 text-haze-2 font-space-mono text-[11px] focus:outline-none truncate"
              style={{ borderRadius: 0 }}
              aria-label="Invite link"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={copyLink}
              className={`cursor-target flex items-center gap-1.5 px-4 border-l border-cosmos-4 font-space-mono text-[10px] transition-colors shrink-0 ${
                copied ? "text-success bg-success/10" : "text-void hover:bg-void/10"
              }`}
              aria-label="Copy invite link"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "COPIED" : "COPY"}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button
              type="button"
              onClick={shareLink}
              className="cursor-target inline-flex items-center gap-1.5 font-space-mono text-[10px] text-haze-2 hover:text-void transition-colors"
            >
              <Share2 size={13} aria-hidden />
              Share link
            </button>
            <p className="font-space-mono text-[9px] text-haze-3">
              Friends sign in, then join automatically · Link expires in 30 min
            </p>
          </div>

          {shareError && (
            <p className="font-rajdhani text-xs text-danger mt-2">{shareError}</p>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 shrink-0 mx-auto sm:mx-0">
          <div className="bg-white p-3 rounded-sm shadow-sm" style={{ lineHeight: 0 }}>
            <QRCodeSVG
              value={inviteLink}
              size={qrSize}
              level="H"
              marginSize={2}
              bgColor="#FFFFFF"
              fgColor="#0B0817"
              title={`Join arena ${roomId}`}
            />
          </div>
          <p className="font-space-mono text-[9px] text-haze-3 flex items-center gap-1.5 tracking-widest uppercase">
            <QrCode size={11} aria-hidden />
            Scan to join
          </p>
        </div>
      </div>
    </div>
  );
}
