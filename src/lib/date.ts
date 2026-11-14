const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const THAI_DAYS = [
  "วันอาทิตย์",
  "วันจันทร์",
  "วันอังคาร",
  "วันพุธ",
  "วันพฤหัสบดี",
  "วันศุกร์",
  "วันเสาร์",
];

function parseDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    if (value.length > 10 && /[T ]/.test(value[10])) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatThaiDate(
  value?: string | Date | null,
  style: "full" | "medium" | "short" = "full",
): string {
  const date = parseDate(value);
  if (!date) return "";
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const buddhistYear = date.getFullYear() + 543;
  if (style === "full") {
    return `${day} ${THAI_MONTHS[monthIndex]} ${buddhistYear}`;
  }
  if (style === "medium") {
    return `${day} ${THAI_MONTHS_SHORT[monthIndex]} ${buddhistYear}`;
  }
  return `${day} ${THAI_MONTHS_SHORT[monthIndex]} ${String(buddhistYear).slice(-2)}`;
}

export function formatThaiDateLongWithDay(value?: string | Date | null): string {
  const date = parseDate(value);
  if (!date) return "";
  return `${THAI_DAYS[date.getDay()]}ที่ ${formatThaiDate(date, "full")}`;
}

export function formatThaiDateTime(value?: string | Date | null): string {
  const date = parseDate(value);
  if (!date) return "";
  const time = new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formatThaiDate(date, "short")} ${time}`;
}

export function toDateInput(value?: string | Date | null): string {
  const date = parseDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(value: Date | string, days: number): Date {
  const date = parseDate(value) ?? new Date();
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function todayInput(): string {
  return toDateInput(new Date());
}

export function defaultNeededDate(): string {
  return toDateInput(addDays(new Date(), 3));
}

export function currentBuddhistYear(): number {
  return new Date().getFullYear() + 543;
}

export function isSameMonth(value: string | null | undefined, now = new Date()): boolean {
  const date = parseDate(value);
  if (!date) return false;
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}
