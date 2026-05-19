import {

  currencyMetaFromLabel,

  loadSettings,

  localeFromLanguage,

  type PreferencesState,

  type TimeFormat,

} from "@/lib/settings/settings";



function getPreferences(): PreferencesState {

  if (typeof window === "undefined") {

    return loadSettings().preferences;

  }

  return loadSettings().preferences;

}



export type CurrencyFormatOptions = {

  fromCents?: boolean;

  maximumFractionDigits?: number;

};



export type CurrencyFormatParts = {

  symbol: string;

  amount: string;

  region: string;

};



export function formatCurrencyParts(

  value: number,

  prefs = getPreferences(),

  options?: CurrencyFormatOptions,

): CurrencyFormatParts {

  const meta = currencyMetaFromLabel(prefs.currency);

  const locale = localeFromLanguage(prefs.language);

  const amount = options?.fromCents ? value / 100 : value;

  const fractionDigits =

    options?.maximumFractionDigits ?? (options?.fromCents ? 2 : 0);



  const formatted = new Intl.NumberFormat(locale, {

    minimumFractionDigits: fractionDigits,

    maximumFractionDigits: fractionDigits,

  }).format(amount);



  return { symbol: meta.symbol, amount: formatted, region: meta.region };

}



export function formatCurrency(

  value: number,

  prefs = getPreferences(),

  options?: CurrencyFormatOptions,

) {

  const { symbol, amount } = formatCurrencyParts(value, prefs, options);

  return `${symbol}${amount}`;

}



function dateFormatParts(format: string) {

  switch (format) {

    case "DD/MM/YYYY":

      return { day: "numeric" as const, month: "short" as const, year: "numeric" as const };

    case "YYYY-MM-DD":

      return { year: "numeric" as const, month: "short" as const, day: "numeric" as const };

    default:

      return { month: "short" as const, day: "numeric" as const, year: "numeric" as const };

  }

}



export function formatDateLabel(dateKey?: string, prefs = getPreferences()) {

  if (!dateKey) return "TBD";



  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) return dateKey;



  return new Date(year, month - 1, day).toLocaleDateString(

    localeFromLanguage(prefs.language),

    dateFormatParts(prefs.dateFormat),

  );

}



export function formatTimeLabel(time24?: string, timeFormat: TimeFormat = getPreferences().timeFormat) {

  if (!time24) return "Time TBD";



  const [hRaw, mRaw] = time24.split(":");

  const h = Number(hRaw);

  const m = Number(mRaw);

  if (!Number.isFinite(h) || !Number.isFinite(m)) return time24;



  if (timeFormat === "24h") {

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  }



  const suffix = h >= 12 ? "PM" : "AM";

  const hour = h % 12 || 12;

  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;

}



export function formatRelativeEventDate(dateKey?: string) {

  if (!dateKey) return "Unscheduled";



  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) return "Scheduled";



  const target = new Date(year, month - 1, day);

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  target.setHours(0, 0, 0, 0);



  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "today";

  if (diffDays === 1) return "tomorrow";

  if (diffDays > 1 && diffDays < 14) return `in ${diffDays} days`;

  if (diffDays >= 14) {

    const weeks = Math.round(diffDays / 7);

    return weeks === 1 ? "in 1 week" : `in ${weeks} weeks`;

  }

  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;

  return "scheduled";

}



export function formatTimeAgo(iso: string, prefs = getPreferences()) {

  const then = Date.parse(iso);

  if (!Number.isFinite(then)) return "recently";



  const diffMs = Date.now() - then;

  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "just now";

  if (diffMinutes < 60) return `${diffMinutes} min ago`;



  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;



  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) return "yesterday";

  if (diffDays < 7) return `${diffDays} days ago`;



  return new Date(then).toLocaleDateString(

    localeFromLanguage(prefs.language),

    dateFormatParts(prefs.dateFormat),

  );

}


