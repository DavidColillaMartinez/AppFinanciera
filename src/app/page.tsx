import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bienvenido</CardTitle>
          <CardDescription>
            App de finanzas personales conectada a Google Sheets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Fases completadas: 0, 1, 2 (PWA + UI base).
          </p>
          <p className="text-sm text-muted-foreground">
            Fases pendientes: 3 a 11.
          </p>
          <div className="pt-2">
            <Button className="w-full" disabled>
              <PlusIcon className="h-4 w-4 mr-2" />
              Conectar Google Sheet (Fase 3)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado del proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Fase 0 - Contrato Sheet
              </span>
              <span className="text-green-600 font-medium">Completada</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Fase 1 - Schemas y tipos
              </span>
              <span className="text-green-600 font-medium">Completada</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Fase 2 - PWA y UI base
              </span>
              <span className="text-green-600 font-medium">Completada</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
