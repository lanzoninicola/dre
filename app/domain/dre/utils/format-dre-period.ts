export default function formatDREPeriod(
  periodStart: Date,
  periodEnd: Date
): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  });

  if (isSameMonth(periodStart, periodEnd)) {
    return formatter.format(periodStart);
  }

  return `${periodStart.toLocaleDateString(
    "pt-BR"
  )} a ${periodEnd.toLocaleDateString("pt-BR")}`;
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}
