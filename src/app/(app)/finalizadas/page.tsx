import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function FinalizadasPage() {
  const supabase = await createClient();
  const { data: auditorias } = await supabase
    .from("auditorias")
    .select("*")
    .eq("status", "finalizada")
    .order("updated_at", { ascending: false });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Auditorias Finalizadas</h1>
          <p className="text-muted-foreground">{auditorias?.length || 0} auditorias concluídas</p>
        </div>
      </div>

      <div className="space-y-3">
        {(auditorias || []).map((a) => (
          <Link key={a.id} href={`/auditoria/${a.id}`}>
            <Card className="hover:shadow-sm transition-shadow cursor-pointer mb-3">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{a.fiscalizada}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.municipio && `${a.municipio} · `}
                        RI: {a.ri || "—"} · OS: {a.os || "—"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Finalizada</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {(auditorias || []).length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma auditoria finalizada ainda.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
