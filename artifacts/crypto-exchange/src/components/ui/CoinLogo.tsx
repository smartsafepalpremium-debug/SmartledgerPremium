import { useState } from "react";
import { COIN_META } from "@/lib/coin-meta";
import { cn } from "@/lib/utils";

interface CoinLogoProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function CoinLogo({ symbol, size = 10, className }: CoinLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const meta = COIN_META[symbol];

  const sizeStyle = { width: size * 4, height: size * 4 };

  if (meta?.logoUrl && !imgFailed) {
    return (
      <img
        src={meta.logoUrl}
        alt={symbol}
        style={sizeStyle}
        className={cn("rounded-full object-contain", className)}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      style={sizeStyle}
      className={cn(
        "rounded-full flex items-center justify-center font-bold border text-sm shrink-0",
        meta?.bg ?? "bg-secondary border-border",
        meta?.color ?? "text-foreground",
        className
      )}
    >
      {symbol.charAt(0)}
    </div>
  );
}
