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