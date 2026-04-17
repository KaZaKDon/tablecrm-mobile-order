import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, "");
}

export function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  const normalized = digits.startsWith("8")
    ? `7${digits.slice(1)}`
    : digits.startsWith("7")
      ? digits
      : `7${digits}`;

  const d = normalized.slice(0, 11);
  const part1 = d.slice(1, 4);
  const part2 = d.slice(4, 7);
  const part3 = d.slice(7, 9);
  const part4 = d.slice(9, 11);

  let result = "+7";
  if (part1) result += ` (${part1}`;
  if (part1.length === 3) result += ")";
  if (part2) result += ` ${part2}`;
  if (part3) result += `-${part3}`;
  if (part4) result += `-${part4}`;
  return result;
}
