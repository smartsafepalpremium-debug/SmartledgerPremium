export type CoinMeta = {
  name: string;
  logoUrl: string;
  brandColor: string;
  color: string;
  bg: string;
  defaultPrice: number;
};

export const COIN_META: Record<string, CoinMeta> = {
  BTC: {
    name: "Bitcoin",
    logoUrl: "https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png",
    brandColor: "#F7931A",
    color: "text-orange-400",
    bg: "bg-orange-500/15 border-orange-500/30",
    defaultPrice: 67500,
  },
  ETH: {
    name: "Ethereum",
    logoUrl: "https://coin-images.coingecko.com/coins/images/279/small/ethereum.png",
    brandColor: "#627EEA",
    color: "text-blue-300",
    bg: "bg-blue-500/15 border-blue-500/30",
    defaultPrice: 3450,
  },
  BNB: {
    name: "BNB",
    logoUrl: "https://coin-images.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    brandColor: "#F3BA2F",
    color: "text-yellow-400",
    bg: "bg-yellow-500/15 border-yellow-500/30",
    defaultPrice: 580,
  },
  SOL: {
    name: "Solana",
    logoUrl: "https://coin-images.coingecko.com/coins/images/4128/small/solana.png",
    brandColor: "#9945FF",
    color: "text-purple-300",
    bg: "bg-purple-500/15 border-purple-500/30",
    defaultPrice: 175,
  },
  XRP: {
    name: "XRP",
    logoUrl: "https://coin-images.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
    brandColor: "#00AAE4",
    color: "text-sky-300",
    bg: "bg-sky-500/15 border-sky-500/30",
    defaultPrice: 0.58,
  },
  ADA: {
    name: "Cardano",
    logoUrl: "https://coin-images.coingecko.com/coins/images/975/small/cardano.png",
    brandColor: "#0033AD",
    color: "text-blue-200",
    bg: "bg-blue-400/15 border-blue-400/30",
    defaultPrice: 0.45,
  },
  DOGE: {
    name: "Dogecoin",
    logoUrl: "https://coin-images.coingecko.com/coins/images/5/small/dogecoin.png",
    brandColor: "#C3A634",
    color: "text-amber-300",
    bg: "bg-amber-500/15 border-amber-500/30",
    defaultPrice: 0.162,
  },
  MATIC: {
    name: "Polygon",
    logoUrl: "https://coin-images.coingecko.com/coins/images/4713/small/matic-token-icon.png",
    brandColor: "#8247E5",
    color: "text-indigo-300",
    bg: "bg-indigo-500/15 border-indigo-500/30",
    defaultPrice: 0.87,
  },
  DOT: {
    name: "Polkadot",
    logoUrl: "https://coin-images.coingecko.com/coins/images/12171/small/polkadot.png",
    brandColor: "#E6007A",
    color: "text-pink-300",
    bg: "bg-pink-500/15 border-pink-500/30",
    defaultPrice: 7.2,
  },
  LINK: {
    name: "Chainlink",
    logoUrl: "https://coin-images.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
    brandColor: "#2A5ADA",
    color: "text-cyan-300",
    bg: "bg-cyan-500/15 border-cyan-500/30",
    defaultPrice: 18.5,
  },
  USDT: {
    name: "Tether",
    logoUrl: "https://coin-images.coingecko.com/coins/images/325/small/Tether.png",
    brandColor: "#26A17B",
    color: "text-emerald-300",
    bg: "bg-emerald-500/15 border-emerald-500/30",
    defaultPrice: 1.0,
  },
  LTC: {
    name: "Litecoin",
    logoUrl: "https://coin-images.coingecko.com/coins/images/2/small/litecoin.png",
    brandColor: "#BFBBBB",
    color: "text-slate-200",
    bg: "bg-slate-400/15 border-slate-400/30",
    defaultPrice: 92,
  },
  TRX: {
    name: "TRON",
    logoUrl: "https://coin-images.coingecko.com/coins/images/1094/small/tron-logo.png",
    brandColor: "#FF0013",
    color: "text-red-300",
    bg: "bg-red-500/15 border-red-500/30",
    defaultPrice: 0.12,
  },
};
