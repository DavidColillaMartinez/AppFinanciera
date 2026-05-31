import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TransactionsPage() {
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Movimientos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El modulo de transacciones se implementara en Fase 5.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
