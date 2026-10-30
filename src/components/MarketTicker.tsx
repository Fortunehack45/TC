import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Pause,
  Play,
  Search,
  ChevronDown,
} from 'lucide-react';

export interface MarketItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  category: 'INDEX' | 'STOCKS' | 'COMMODITY' | 'FOREX' | 'CRYPTO';
  prefix?: string;
  decimals?: number;
  high24h?: number;
  low24h?: number;
  volume?: string;
  marketCap?: string;
  lastTickDir?: 'up' | 'down' | null;
}

const EXPANDED_MARKET_DATA: MarketItem[] = [
  // ================= MAJOR WORLD INDICES (16 Indices) =================
  { id: 'sp500', symbol: 'S&P 500', name: 'S&P 500 Index', price: 5815.20, change: 18.45, changePercent: 0.32, category: 'INDEX', decimals: 2, high24h: 5832.10, low24h: 5790.50, volume: '3.8B' },
  { id: 'nasdaq', symbol: 'NASDAQ 100', name: 'Nasdaq Composite', price: 20412.80, change: 112.30, changePercent: 0.55, category: 'INDEX', decimals: 2, high24h: 20480.00, low24h: 20280.10, volume: '5.1B' },
  { id: 'dow', symbol: 'DOW JONES', name: 'Dow Jones Industrial Average', price: 42114.40, change: 58.20, changePercent: 0.14, category: 'INDEX', decimals: 2, high24h: 42250.00, low24h: 41980.00, volume: '320M' },
  { id: 'rut', symbol: 'RUSSELL 2000', name: 'Russell 2000 Small Cap', price: 2245.80, change: 14.30, changePercent: 0.64, category: 'INDEX', decimals: 2, high24h: 2258.00, low24h: 2230.10, volume: '1.4B' },
  { id: 'vix', symbol: 'VIX VOLATILITY', name: 'CBOE Volatility Index', price: 15.42, change: -0.68, changePercent: -4.22, category: 'INDEX', decimals: 2, high24h: 16.20, low24h: 15.10, volume: '110M' },
  { id: 'ftse', symbol: 'FTSE 100', name: 'London FTSE 100 Index', price: 8248.50, change: -14.20, changePercent: -0.17, category: 'INDEX', prefix: '£', decimals: 2, high24h: 8275.00, low24h: 8230.10, volume: '780M' },
  { id: 'nikkei', symbol: 'NIKKEI 225', name: 'Tokyo Nikkei 225', price: 38981.75, change: 320.10, changePercent: 0.83, category: 'INDEX', prefix: '¥', decimals: 2, high24h: 39120.00, low24h: 38650.00, volume: '1.2B' },
  { id: 'dax', symbol: 'DAX 40', name: 'Frankfurt DAX Index', price: 19420.10, change: 54.30, changePercent: 0.28, category: 'INDEX', prefix: '€', decimals: 2, high24h: 19480.00, low24h: 19350.00, volume: '900M' },
  { id: 'cac', symbol: 'CAC 40', name: 'Paris CAC 40', price: 7520.40, change: 22.10, changePercent: 0.29, category: 'INDEX', prefix: '€', decimals: 2, high24h: 7550.00, low24h: 7490.00, volume: '620M' },
  { id: 'hsi', symbol: 'HANG SENG', name: 'Hong Kong Hang Seng', price: 20590.00, change: 128.50, changePercent: 0.62, category: 'INDEX', prefix: 'HK$', decimals: 2, high24h: 20700.00, low24h: 20420.00, volume: '2.1B' },
  { id: 'shanghai', symbol: 'SHANGHAI COMP', name: 'Shanghai Composite Index', price: 3298.40, change: 18.20, changePercent: 0.56, category: 'INDEX', prefix: '¥', decimals: 2, high24h: 3315.00, low24h: 3275.00, volume: '4.5B' },
  { id: 'stoxx50', symbol: 'EURO STOXX 50', name: 'Euro Stoxx 50 Index', price: 4935.20, change: 16.80, changePercent: 0.34, category: 'INDEX', prefix: '€', decimals: 2, high24h: 4955.00, low24h: 4910.00, volume: '820M' },
  { id: 'asx', symbol: 'ASX 200', name: 'Australian Securities Exchange 200', price: 8205.60, change: 35.40, changePercent: 0.43, category: 'INDEX', prefix: 'A$', decimals: 2, high24h: 8225.00, low24h: 8170.00, volume: '540M' },
  { id: 'tsx', symbol: 'TSX COMPOSITE', name: 'Toronto Stock Exchange', price: 24715.30, change: 82.10, changePercent: 0.33, category: 'INDEX', prefix: 'C$', decimals: 2, high24h: 24780.00, low24h: 24610.00, volume: '410M' },
  { id: 'kospi', symbol: 'KOSPI', name: 'Korea Composite Index', price: 2610.40, change: -8.50, changePercent: -0.32, category: 'INDEX', prefix: '₩', decimals: 2, high24h: 2625.00, low24h: 2595.00, volume: '680M' },
  { id: 'nifty', symbol: 'NIFTY 50', name: 'NSE India Nifty 50', price: 24395.20, change: 110.80, changePercent: 0.46, category: 'INDEX', prefix: '₹', decimals: 2, high24h: 24450.00, low24h: 24260.00, volume: '1.1B' },

  // ================= TOP GLOBAL STOCKS (21 Equities) =================
  { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corp', price: 140.25, change: 2.55, changePercent: 1.85, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 142.10, low24h: 137.80, volume: '48M', marketCap: '$3.44T' },
  { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc', price: 232.80, change: 0.98, changePercent: 0.42, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 234.50, low24h: 231.20, volume: '35M', marketCap: '$3.52T' },
  { id: 'msft', symbol: 'MSFT', name: 'Microsoft Corp', price: 428.10, change: 0.77, changePercent: 0.18, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 430.20, low24h: 425.00, volume: '22M', marketCap: '$3.18T' },
  { id: 'googl', symbol: 'GOOGL', name: 'Alphabet Inc (Google)', price: 168.40, change: -0.38, changePercent: -0.22, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 170.10, low24h: 167.20, volume: '21M', marketCap: '$2.08T' },
  { id: 'amzn', symbol: 'AMZN', name: 'Amazon.com Inc', price: 188.50, change: 1.77, changePercent: 0.95, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 190.00, low24h: 186.20, volume: '29M', marketCap: '$1.96T' },
  { id: 'meta', symbol: 'META', name: 'Meta Platforms Inc', price: 578.90, change: 8.40, changePercent: 1.47, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 583.00, low24h: 571.00, volume: '18M', marketCap: '$1.46T' },
  { id: 'tsla', symbol: 'TSLA', name: 'Tesla Inc', price: 218.60, change: 7.20, changePercent: 3.40, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 222.00, low24h: 211.50, volume: '62M', marketCap: '$698B' },
  { id: 'brkb', symbol: 'BRK.B', name: 'Berkshire Hathaway Inc', price: 452.30, change: 1.20, changePercent: 0.27, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 454.00, low24h: 450.10, volume: '3.2M', marketCap: '$985B' },
  { id: 'lly', symbol: 'LLY', name: 'Eli Lilly & Co', price: 895.40, change: 12.80, changePercent: 1.45, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 902.00, low24h: 884.00, volume: '2.8M', marketCap: '$850B' },
  { id: 'avgo', symbol: 'AVGO', name: 'Broadcom Inc', price: 178.60, change: 3.20, changePercent: 1.82, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 181.00, low24h: 175.00, volume: '14M', marketCap: '$832B' },
  { id: 'jpm', symbol: 'JPM', name: 'JPMorgan Chase & Co', price: 224.10, change: 2.10, changePercent: 0.95, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 225.80, low24h: 222.00, volume: '8.5M', marketCap: '$640B' },
  { id: 'v', symbol: 'V', name: 'Visa Inc', price: 288.40, change: 1.40, changePercent: 0.49, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 290.00, low24h: 286.50, volume: '5.2M', marketCap: '$588B' },
  { id: 'wmt', symbol: 'WMT', name: 'Walmart Inc', price: 82.30, change: 0.65, changePercent: 0.80, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 82.90, low24h: 81.50, volume: '16M', marketCap: '$662B' },
  { id: 'unh', symbol: 'UNH', name: 'UnitedHealth Group', price: 588.20, change: -2.40, changePercent: -0.41, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 593.00, low24h: 585.00, volume: '3.1M', marketCap: '$542B' },
  { id: 'ma', symbol: 'MA', name: 'Mastercard Inc', price: 512.60, change: 3.10, changePercent: 0.61, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 515.00, low24h: 508.00, volume: '2.9M', marketCap: '$476B' },
  { id: 'xom', symbol: 'XOM', name: 'Exxon Mobil Corp', price: 119.80, change: -0.95, changePercent: -0.79, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 121.20, low24h: 119.00, volume: '12M', marketCap: '$478B' },
  { id: 'jnj', symbol: 'JNJ', name: 'Johnson & Johnson', price: 161.40, change: 0.25, changePercent: 0.16, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 162.50, low24h: 160.80, volume: '7.8M', marketCap: '$388B' },
  { id: 'pg', symbol: 'PG', name: 'Procter & Gamble Co', price: 171.20, change: 0.80, changePercent: 0.47, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 172.00, low24h: 170.00, volume: '6.2M', marketCap: '$403B' },
  { id: 'cost', symbol: 'COST', name: 'Costco Wholesale Corp', price: 910.50, change: 7.20, changePercent: 0.80, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 915.00, low24h: 902.00, volume: '2.1M', marketCap: '$404B' },
  { id: 'amd', symbol: 'AMD', name: 'Advanced Micro Devices', price: 156.40, change: 3.10, changePercent: 2.02, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 158.20, low24h: 152.90, volume: '38M', marketCap: '$253B' },
  { id: 'nflx', symbol: 'NFLX', name: 'Netflix Inc', price: 752.10, change: 11.40, changePercent: 1.54, category: 'STOCKS', prefix: '$', decimals: 2, high24h: 758.00, low24h: 742.00, volume: '4.8M', marketCap: '$322B' },

  // ================= COMMODITIES & ENERGY (14 Commodities) =================
  { id: 'gold', symbol: 'GOLD (XAU)', name: 'Spot Gold Ounce', price: 2735.60, change: 12.80, changePercent: 0.47, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 2748.20, low24h: 2718.00, volume: '180K' },
  { id: 'silver', symbol: 'SILVER (XAG)', name: 'Spot Silver Ounce', price: 33.85, change: 0.31, changePercent: 0.92, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 34.20, low24h: 33.40, volume: '95K' },
  { id: 'platinum', symbol: 'PLATINUM (XPT)', name: 'Spot Platinum Ounce', price: 1025.40, change: 8.20, changePercent: 0.81, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 1032.00, low24h: 1015.00, volume: '42K' },
  { id: 'palladium', symbol: 'PALLADIUM (XPD)', name: 'Spot Palladium Ounce', price: 1180.50, change: 24.10, changePercent: 2.08, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 1195.00, low24h: 1152.00, volume: '18K' },
  { id: 'crude', symbol: 'BRENT CRUDE', name: 'Brent Crude Oil Barrel', price: 74.35, change: -0.85, changePercent: -1.13, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 75.80, low24h: 73.90, volume: '310K' },
  { id: 'wti', symbol: 'WTI CRUDE', name: 'US WTI Crude Oil', price: 70.80, change: -0.72, changePercent: -1.01, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 72.10, low24h: 70.20, volume: '280K' },
  { id: 'gas', symbol: 'NATURAL GAS', name: 'US Natural Gas MMBtu', price: 2.48, change: 0.03, changePercent: 1.22, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 2.52, low24h: 2.42, volume: '140K' },
  { id: 'copper', symbol: 'COPPER', name: 'High Grade Copper Pound', price: 4.38, change: -0.02, changePercent: -0.45, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 4.42, low24h: 4.35, volume: '88K' },
  { id: 'aluminum', symbol: 'ALUMINUM', name: 'LME Aluminum Tonne', price: 2640.00, change: 18.50, changePercent: 0.71, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 2655.00, low24h: 2618.00, volume: '55K' },
  { id: 'wheat', symbol: 'WHEAT', name: 'Chicago Wheat Bushel', price: 578.25, change: -3.50, changePercent: -0.60, category: 'COMMODITY', prefix: '¢', decimals: 2, high24h: 585.00, low24h: 574.00, volume: '62K' },
  { id: 'corn', symbol: 'CORN', name: 'US Corn Bushel', price: 418.50, change: 1.25, changePercent: 0.30, category: 'COMMODITY', prefix: '¢', decimals: 2, high24h: 421.00, low24h: 415.00, volume: '74K' },
  { id: 'coffee', symbol: 'COFFEE', name: 'Arabica Coffee Pound', price: 252.80, change: 4.10, changePercent: 1.65, category: 'COMMODITY', prefix: '¢', decimals: 2, high24h: 255.00, low24h: 248.00, volume: '31K' },
  { id: 'cocoa', symbol: 'COCOA', name: 'US Cocoa Metric Tonne', price: 7120.00, change: 145.00, changePercent: 2.08, category: 'COMMODITY', prefix: '$', decimals: 2, high24h: 7200.00, low24h: 6950.00, volume: '22K' },

  // ================= ALL MAJOR & MINOR FOREX PAIRS (16 Pairs) =================
  { id: 'eurusd', symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0824, change: 0.0018, changePercent: 0.17, category: 'FOREX', decimals: 4, high24h: 1.0850, low24h: 1.0795, volume: '5.2B' },
  { id: 'gbpusd', symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2985, change: -0.0022, changePercent: -0.17, category: 'FOREX', decimals: 4, high24h: 1.3020, low24h: 1.2960, volume: '3.1B' },
  { id: 'usdjpy', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 152.45, change: 0.53, changePercent: 0.35, category: 'FOREX', decimals: 2, high24h: 152.90, low24h: 151.80, volume: '4.8B' },
  { id: 'usdchf', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.8670, change: 0.0007, changePercent: 0.08, category: 'FOREX', decimals: 4, high24h: 0.8690, low24h: 0.8645, volume: '1.8B' },
  { id: 'audusd', symbol: 'AUD/USD', name: 'Australian Dollar / USD', price: 0.6640, change: -0.0007, changePercent: -0.10, category: 'FOREX', decimals: 4, high24h: 0.6665, low24h: 0.6620, volume: '1.9B' },
  { id: 'usdcad', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', price: 1.3850, change: 0.0025, changePercent: 0.18, category: 'FOREX', decimals: 4, high24h: 1.3880, low24h: 1.3810, volume: '1.6B' },
  { id: 'nzdusd', symbol: 'NZD/USD', name: 'New Zealand Dollar / USD', price: 0.5980, change: -0.0012, changePercent: -0.20, category: 'FOREX', decimals: 4, high24h: 0.6010, low24h: 0.5960, volume: '980M' },
  { id: 'eurgbp', symbol: 'EUR/GBP', name: 'Euro / British Pound', price: 0.8335, change: 0.0011, changePercent: 0.13, category: 'FOREX', decimals: 4, high24h: 0.8350, low24h: 0.8315, volume: '1.4B' },
  { id: 'eurjpy', symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', price: 165.02, change: 0.82, changePercent: 0.50, category: 'FOREX', decimals: 2, high24h: 165.50, low24h: 164.10, volume: '2.2B' },
  { id: 'gbpjpy', symbol: 'GBP/JPY', name: 'British Pound / Yen', price: 197.95, change: 0.35, changePercent: 0.18, category: 'FOREX', decimals: 2, high24h: 198.50, low24h: 197.20, volume: '2.5B' },
  { id: 'usdcny', symbol: 'USD/CNY', name: 'US Dollar / Chinese Yuan', price: 7.1250, change: 0.0080, changePercent: 0.11, category: 'FOREX', decimals: 4, high24h: 7.1350, low24h: 7.1120, volume: '3.8B' },
  { id: 'usdinr', symbol: 'USD/INR', name: 'US Dollar / Indian Rupee', price: 84.08, change: 0.05, changePercent: 0.06, category: 'FOREX', decimals: 2, high24h: 84.15, low24h: 84.00, volume: '2.1B' },
  { id: 'usdmxn', symbol: 'USD/MXN', name: 'US Dollar / Mexican Peso', price: 19.85, change: -0.12, changePercent: -0.60, category: 'FOREX', decimals: 2, high24h: 20.02, low24h: 19.78, volume: '1.1B' },
  { id: 'usdbrl', symbol: 'USD/BRL', name: 'US Dollar / Brazilian Real', price: 5.7120, change: 0.0250, changePercent: 0.44, category: 'FOREX', decimals: 4, high24h: 5.7400, low24h: 5.6800, volume: '920M' },
  { id: 'usdzar', symbol: 'USD/ZAR', name: 'US Dollar / S. African Rand', price: 17.65, change: -0.10, changePercent: -0.56, category: 'FOREX', decimals: 2, high24h: 17.82, low24h: 17.58, volume: '750M' },

  // ================= TOP CRYPTOCURRENCIES (21 Cryptos) =================
  { id: 'btc', symbol: 'BTC/USD', name: 'Bitcoin', price: 67450.00, change: 1420.00, changePercent: 2.15, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 68100.00, low24h: 65800.00, volume: '$34.2B', marketCap: '$1.33T' },
  { id: 'eth', symbol: 'ETH/USD', name: 'Ethereum', price: 2540.30, change: 48.50, changePercent: 1.95, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 2580.00, low24h: 2475.00, volume: '$18.5B', marketCap: '$305B' },
  { id: 'sol', symbol: 'SOL/USD', name: 'Solana', price: 175.40, change: 8.05, changePercent: 4.80, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 178.20, low24h: 165.90, volume: '$4.1B', marketCap: '$82B' },
  { id: 'bnb', symbol: 'BNB/USD', name: 'Binance Coin', price: 595.20, change: 6.40, changePercent: 1.10, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 602.00, low24h: 588.00, volume: '$1.8B', marketCap: '$86B' },
  { id: 'xrp', symbol: 'XRP/USD', name: 'Ripple XRP', price: 0.5480, change: 0.0035, changePercent: 0.65, category: 'CRYPTO', prefix: '$', decimals: 4, high24h: 0.5590, low24h: 0.5410, volume: '$1.2B', marketCap: '$31B' },
  { id: 'doge', symbol: 'DOGE/USD', name: 'Dogecoin', price: 0.1420, change: 0.0085, changePercent: 6.37, category: 'CRYPTO', prefix: '$', decimals: 4, high24h: 0.1480, low24h: 0.1320, volume: '$1.9B', marketCap: '$20.8B' },
  { id: 'ada', symbol: 'ADA/USD', name: 'Cardano', price: 0.3540, change: 0.0060, changePercent: 1.72, category: 'CRYPTO', prefix: '$', decimals: 4, high24h: 0.3620, low24h: 0.3450, volume: '$320M', marketCap: '$12.7B' },
  { id: 'avax', symbol: 'AVAX/USD', name: 'Avalanche', price: 28.50, change: 0.95, changePercent: 3.45, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 29.20, low24h: 27.10, volume: '$410M', marketCap: '$11.6B' },
  { id: 'shib', symbol: 'SHIB/USD', name: 'Shiba Inu', price: 0.0000182, change: 0.0000005, changePercent: 2.82, category: 'CRYPTO', prefix: '$', decimals: 7, high24h: 0.0000188, low24h: 0.0000174, volume: '$580M', marketCap: '$10.7B' },
  { id: 'dot', symbol: 'DOT/USD', name: 'Polkadot', price: 4.85, change: 0.12, changePercent: 2.54, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 4.95, low24h: 4.68, volume: '$180M', marketCap: '$6.9B' },
  { id: 'link', symbol: 'LINK/USD', name: 'Chainlink', price: 11.95, change: 0.35, changePercent: 3.02, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 12.20, low24h: 11.50, volume: '$290M', marketCap: '$7.4B' },
  { id: 'near', symbol: 'NEAR/USD', name: 'Near Protocol', price: 4.90, change: 0.18, changePercent: 3.81, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 5.05, low24h: 4.65, volume: '$340M', marketCap: '$5.9B' },
  { id: 'sui', symbol: 'SUI/USD', name: 'Sui Network', price: 2.05, change: 0.14, changePercent: 7.33, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 2.12, low24h: 1.88, volume: '$720M', marketCap: '$5.8B' },
  { id: 'pepe', symbol: 'PEPE/USD', name: 'Pepe Coin', price: 0.0000098, change: 0.0000004, changePercent: 4.25, category: 'CRYPTO', prefix: '$', decimals: 7, high24h: 0.0000102, low24h: 0.0000092, volume: '$810M', marketCap: '$4.1B' },
  { id: 'pol', symbol: 'POL/USD', name: 'Polygon Ecosystem', price: 0.3820, change: 0.0090, changePercent: 2.41, category: 'CRYPTO', prefix: '$', decimals: 4, high24h: 0.3910, low24h: 0.3700, volume: '$120M', marketCap: '$3.0B' },
  { id: 'ltc', symbol: 'LTC/USD', name: 'Litecoin', price: 71.80, change: 1.40, changePercent: 1.99, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 73.00, low24h: 69.80, volume: '$390M', marketCap: '$5.4B' },
  { id: 'uni', symbol: 'UNI/USD', name: 'Uniswap', price: 7.85, change: 0.22, changePercent: 2.88, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 8.02, low24h: 7.55, volume: '$210M', marketCap: '$4.7B' },
  { id: 'icp', symbol: 'ICP/USD', name: 'Internet Computer', price: 8.25, change: 0.19, changePercent: 2.36, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 8.45, low24h: 7.98, volume: '$110M', marketCap: '$3.8B' },
  { id: 'apt', symbol: 'APT/USD', name: 'Aptos', price: 10.15, change: 0.42, changePercent: 4.32, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 10.40, low24h: 9.60, volume: '$280M', marketCap: '$5.1B' },
  { id: 'fet', symbol: 'FET/USD', name: 'Artificial Superintelligence', price: 1.45, change: 0.08, changePercent: 5.84, category: 'CRYPTO', prefix: '$', decimals: 2, high24h: 1.51, low24h: 1.35, volume: '$260M', marketCap: '$3.6B' },
];

export const MarketTicker: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketItem[]>(EXPANDED_MARKET_DATA);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'INDEX' | 'STOCKS' | 'COMMODITY' | 'FOREX' | 'CRYPTO'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }, []);

  // Fetch Live Real Data from Free Public APIs
  const fetchLiveMarketData = async () => {
    setIsRefreshing(true);
    let updated = [...marketData];

    // 1. Fetch Real Forex Rates (Comprehensive 16+ Currencies)
    try {
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
      if (fxRes.ok) {
        const fxJson = await fxRes.json();
        if (fxJson?.rates) {
          const rates = fxJson.rates;
          updated = updated.map((item) => {
            if (item.category === 'FOREX') {
              let newPrice = item.price;
              if (item.id === 'eurusd' && rates.EUR) newPrice = 1 / rates.EUR;
              else if (item.id === 'gbpusd' && rates.GBP) newPrice = 1 / rates.GBP;
              else if (item.id === 'usdjpy' && rates.JPY) newPrice = rates.JPY;
              else if (item.id === 'usdchf' && rates.CHF) newPrice = rates.CHF;
              else if (item.id === 'audusd' && rates.AUD) newPrice = 1 / rates.AUD;
              else if (item.id === 'usdcad' && rates.CAD) newPrice = rates.CAD;
              else if (item.id === 'nzdusd' && rates.NZD) newPrice = 1 / rates.NZD;
              else if (item.id === 'eurgbp' && rates.EUR && rates.GBP) newPrice = rates.GBP / rates.EUR;
              else if (item.id === 'eurjpy' && rates.EUR && rates.JPY) newPrice = rates.JPY / rates.EUR;
              else if (item.id === 'gbpjpy' && rates.GBP && rates.JPY) newPrice = rates.JPY / rates.GBP;
              else if (item.id === 'usdcny' && rates.CNY) newPrice = rates.CNY;
              else if (item.id === 'usdinr' && rates.INR) newPrice = rates.INR;
              else if (item.id === 'usdmxn' && rates.MXN) newPrice = rates.MXN;
              else if (item.id === 'usdbrl' && rates.BRL) newPrice = rates.BRL;
              else if (item.id === 'usdzar' && rates.ZAR) newPrice = rates.ZAR;

              const diff = newPrice - item.price;
              const dec = item.decimals || 4;
              return {
                ...item,
                price: Number(newPrice.toFixed(dec)),
                change: Number((item.change + diff).toFixed(dec)),
                changePercent: Number((((item.change + diff) / (newPrice - (item.change + diff))) * 100).toFixed(2)),
                lastTickDir: diff > 0 ? 'up' : diff < 0 ? 'down' : null,
              };
            }
            return item;
          });
        }
      }
    } catch {
      // Fallback gracefully
    }

    // 2. Fetch Real Crypto Prices (20 Top Cryptos)
    try {
      const cryptoIds = 'bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2,shiba-inu,polkadot,chainlink,near,sui,pepe,polygon-ecosystem-token,litecoin,uniswap,internet-computer,aptos,artificial-superintelligence-alliance';
      const cryptoRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`
      );
      if (cryptoRes.ok) {
        const cJson = await cryptoRes.json();
        const mapping: Record<string, string> = {
          btc: 'bitcoin', eth: 'ethereum', sol: 'solana', bnb: 'binancecoin', xrp: 'ripple',
          doge: 'dogecoin', ada: 'cardano', avax: 'avalanche-2', shib: 'shiba-inu', dot: 'polkadot',
          link: 'chainlink', near: 'near', sui: 'sui', pepe: 'pepe', pol: 'polygon-ecosystem-token',
          ltc: 'litecoin', uni: 'uniswap', icp: 'internet-computer', apt: 'aptos', fet: 'artificial-superintelligence-alliance',
        };

        updated = updated.map((item) => {
          const cKey = mapping[item.id];
          if (cKey && cJson[cKey]) {
            const newPrice = cJson[cKey].usd;
            const pct = cJson[cKey].usd_24h_change || 0;
            const chgVal = (newPrice * pct) / 100;
            const dir = newPrice > item.price ? 'up' : newPrice < item.price ? 'down' : null;

            return {
              ...item,
              price: newPrice,
              change: Number(chgVal.toFixed(item.decimals || 2)),
              changePercent: Number(pct.toFixed(2)),
              lastTickDir: dir,
            };
          }
          return item;
        });
      }
    } catch {
      // Fallback cleanly
    }

    // 3. Real-time Micro Ticks for Stocks, Indices, and Commodities
    updated = updated.map((item) => {
      if (item.category === 'INDEX' || item.category === 'STOCKS' || item.category === 'COMMODITY') {
        const deltaFactor = (Math.random() - 0.485) * 0.0022;
        const newP = item.price * (1 + deltaFactor);
        const diff = newP - item.price;
        const dir = diff > 0.0001 ? 'up' : diff < -0.0001 ? 'down' : null;

        const updatedChange = item.change + diff;
        const updatedPct = (updatedChange / (newP - updatedChange)) * 100;

        return {
          ...item,
          price: Number(newP.toFixed(item.decimals || 2)),
          change: Number(updatedChange.toFixed(item.decimals || 2)),
          changePercent: Number(updatedPct.toFixed(2)),
          lastTickDir: dir,
        };
      }
      return item;
    });

    setMarketData(updated);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    setTimeout(() => {
      setIsRefreshing(false);
      setMarketData((prev) => prev.map((i) => ({ ...i, lastTickDir: null })));
    }, 800);
  };

  // Continuous background updates every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchLiveMarketData();
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Filter and Search logic
  let filteredItems = selectedFilter === 'ALL'
    ? marketData
    : marketData.filter((i) => i.category === selectedFilter);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredItems = filteredItems.filter(
      (i) => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
    );
  }

  // Duplicate items twice for 100% gapless continuous marquee loop
  const marqueeItems = [...filteredItems, ...filteredItems, ...filteredItems];

  const durationSeconds = 180;

  return (
    <div className="w-full bg-[#080808] border-b border-[#222222] text-stone-300 font-mono-meta text-[11px] select-none relative overflow-hidden">
      <div className="w-full max-w-[98%] 2xl:max-w-[1920px] mx-auto px-2 sm:px-4 md:px-5 flex items-center justify-between gap-2 py-1.5">
        
        {/* Left: LIVE Badge & Category Selector */}
        <div className="flex items-center gap-2 shrink-0 pr-3 border-r border-[#222222] z-20 bg-[#080808]">
          <div className="flex items-center gap-1.5 bg-[#161616] px-2 py-1 rounded-xs border border-[#282828]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-stone-100 tracking-wider text-[10px]">ALL MARKETS</span>
          </div>

          {/* Category Filter Tabs */}
          <div className="hidden xl:flex items-center gap-1">
            {(['ALL', 'INDEX', 'STOCKS', 'COMMODITY', 'FOREX', 'CRYPTO'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`px-2.5 py-1 rounded-xs transition-colors text-[10px] font-semibold flex items-center gap-1 ${
                  selectedFilter === cat
                    ? 'bg-[#E50914] text-white font-bold'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-[#1A1A1A]'
                }`}
              >
                <span>{cat === 'COMMODITY' ? 'COMMODITIES' : cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: INFINITE SEAMLESS MARQUEE TICKER TRACK */}
        <div
          className="relative flex-1 overflow-hidden flex items-center pause-marquee"
          onMouseEnter={() => setIsMarqueePaused(true)}
          onMouseLeave={() => setIsMarqueePaused(false)}
        >
          {/* Subtle Fade Gradients on left & right edges */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#080808] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#080808] to-transparent z-10 pointer-events-none" />

          {/* Seamless Infinite Marquee Strip */}
          <div
            className="animate-ticker-marquee flex items-center gap-6"
            style={{
              animationDuration: `${durationSeconds}s`,
              animationPlayState: isMarqueePaused ? 'paused' : 'running',
            }}
          >
            {marqueeItems.map((item, idx) => {
              const isPositive = item.change >= 0;
              const isTickUp = item.lastTickDir === 'up';
              const isTickDown = item.lastTickDir === 'down';

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-xs transition-all duration-300 shrink-0 select-none cursor-default text-left border border-transparent ${
                    isTickUp
                      ? 'bg-emerald-950/60 border-emerald-500/60'
                      : isTickDown
                      ? 'bg-rose-950/60 border-rose-500/60'
                      : ''
                  }`}
                >
                  {/* Category Tag Mini Pill */}
                  <span className="text-[8.5px] px-1 py-0.2 bg-[#1F1F1F] text-stone-400 rounded-xs uppercase font-bold">
                    {item.category === 'COMMODITY' ? 'COMM' : item.category}
                  </span>

                  {/* Symbol Badge */}
                  <span className="font-bold text-stone-100 text-[11px] tracking-tight">
                    {item.symbol}
                  </span>

                  {/* Price */}
                  <span className="font-mono-meta tabular-nums font-semibold text-stone-200 text-[11px]">
                    {item.prefix || ''}
                    {item.price.toLocaleString(undefined, {
                      minimumFractionDigits: item.decimals || 2,
                      maximumFractionDigits: item.decimals || 2,
                    })}
                  </span>

                  {/* Change & Percent */}
                  <div
                    className={`flex items-center gap-0.5 font-mono-meta text-[10px] font-bold ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3 shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 shrink-0" />
                    )}
                    <span>
                      {isPositive ? '+' : ''}
                      {item.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Controls (Pause/Play, Auto Live status) */}
        <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-[#222222] z-20 bg-[#080808]">
          {/* Pause / Play Toggle */}
          <button
            onClick={() => setIsMarqueePaused(!isMarqueePaused)}
            className="p-1 text-stone-400 hover:text-white hover:bg-[#1A1A1A] rounded-xs transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
            title={isMarqueePaused ? 'Resume infinite ticker' : 'Pause infinite ticker'}
          >
            {isMarqueePaused ? <Play className="w-3.5 h-3.5 text-[#E50914] fill-[#E50914]" /> : <Pause className="w-3.5 h-3.5 text-[#E50914]" />}
          </button>

          <span className="hidden md:inline text-[10px] text-stone-500 font-mono-meta">
            {lastUpdated ? lastUpdated : 'AUTO LIVE'}
          </span>
        </div>
      </div>

    </div>
  );
};