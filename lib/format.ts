const currencyFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("en-ZA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function formatCompactCurrency(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export function formatDate(date: string) {
  return dateFormatter.format(new Date(date));
}
