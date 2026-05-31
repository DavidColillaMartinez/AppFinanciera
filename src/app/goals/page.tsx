import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function GoalsPage() {
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Objetivos</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El modulo de objetivos se implementara en Fase 9.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
