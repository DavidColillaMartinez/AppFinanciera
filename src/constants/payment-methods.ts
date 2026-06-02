export const PaymentMethod = {
  TARJETA: "Tarjeta",
  EFECTIVO: "Efectivo",
  BIZUM: "Bizum",
  TRANSFERENCIA: "Transferencia",
  DOMICILIACION: "Domiciliacion",
  OTRO: "Otro",
} as const;

export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.TARJETA, label: "Tarjeta" },
  { value: PaymentMethod.EFECTIVO, label: "Efectivo" },
  { value: PaymentMethod.BIZUM, label: "Bizum" },
  { value: PaymentMethod.TRANSFERENCIA, label: "Transferencia" },
  { value: PaymentMethod.DOMICILIACION, label: "Domiciliacion" },
  { value: PaymentMethod.OTRO, label: "Otro" },
];

const ALLOWED_VALUES = new Set<string>(
  Object.values(PaymentMethod) as string[],
);

export function normalizePaymentMethod(raw: string | undefined | null): string {
  if (!raw) return "";
  const value = String(raw).trim();
  if (!value) return "";
  if (ALLOWED_VALUES.has(value)) return value;
  const lower = value.toLowerCase();
  for (const allowed of ALLOWED_VALUES) {
    if (allowed.toLowerCase() === lower) return allowed;
  }
  return PaymentMethod.OTRO;
}