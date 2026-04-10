"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, AlertTriangle, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import type { Auditoria } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardContentProps {
  userName: string;
  auditorias: Auditoria[];
  finalizadasCount: number;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function isVencida(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function isVenceSemana(dateStr: string | null) {
  if (!dateStr) return false;
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

export function DashboardContent({ userName, auditorias, finalizadasCount }: DashboardContentProps) {
  const lastUpdate = (a: Auditoria) => {
    const dates = [
      ...(a.atualizacoes || []).map((u) => u.created_at),
      a.updated_at,
    ];
    const latest = dates.sort().reverse()[0];
    if (!latest) return "Nenhuma atividade";
    return formatDistanceToNow(new Date(latest), { locale: ptBR, addSuffix: true });
  };

  const lastPendencia = (a: Auditoria) => {
    const pending = (a.pendencias || []).filter((p) => !p.realizada);
    if (pending.length === 0) return null;
    return pending[pending.length - 1]?.descricao;
  };

  const detDate = (a: Auditoria) => {
    const dets = a.dets || [];
    if (dets.length === 0) return "Sem DET";
    const last = dets.sort((x, y) => (x.created_at > y.created_at ? -1 : 1))[0];
    return formatDate(last.data_notificacao) || "DET";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Minhas Auditorias</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {userName}! Gerencie suas fiscalizações
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-3xl font-bold text-orange-600">{auditorias.length}</p>
                <p className="text-xs text-muted-foreground">Auditorias ativas</p>
              </div>
              <Clock className="h-8 w-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-3xl font-bold text-green-600">{finalizadasCount}</p>
                <p className="text-xs text-muted-foreground">Auditorias finalizadas</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agenda</p>
                <p className="text-lg font-semibold">
                  {new Date().toLocaleString("pt-BR", { month: "long", year: "numeric" })}
                </p>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {auditorias
                    .filter((a) => a.dets && a.dets.length > 0)
                    .slice(0, 3)
                    .map((a) => (
                      <p key={a.id}>
                        {detDate(a)} - {a.fiscalizada}
                      </p>
                    ))}
                </div>
              </div>
              <Calendar className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Title */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Auditorias em Andamento
        </h2>
        <p className="text-sm text-muted-foreground">
          Organizadas da mais antiga para a mais recente
        </p>
      </div>

      {/* Audit Cards Grid */}
      {auditorias.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>Nenhuma auditoria em andamento.</p>
            <Link href="/nova-auditoria">
              <Button className="mt-4">Criar primeira auditoria</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auditorias.map((a) => {
            const vencida = isVencida(a.data_vencimento);
            const venceSemana = isVenceSemana(a.data_vencimento);
            const pendencia = lastPendencia(a);

            return (
              <Link key={a.id} href={`/auditoria/${a.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {a.me_epp && (
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            ME/EPP
                          </Badge>
                        )}
                        <CardTitle className="text-base truncate">
                          {a.fiscalizada}
                        </CardTitle>
                      </div>
                      {vencida ? (
                        <Badge variant="destructive" className="shrink-0 text-xs">
                          Vence em {formatDate(a.data_vencimento)}
                        </Badge>
                      ) : venceSemana ? (
                        <Badge className="shrink-0 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                          Vence em {formatDate(a.data_vencimento)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          Em andamento
                        </Badge>
                      )}
                    </div>
                    {a.ri && (
                      <p className="text-xs text-muted-foreground">RI: {a.ri}</p>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div>
                        <p className="text-muted-foreground">DET:</p>
                        <p className="font-medium text-blue-600">{detDate(a)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Último andamento:</p>
                        <p className="font-medium">{lastUpdate(a)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Município:</p>
                        <p className="font-medium flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {a.municipio || "—"}
                        </p>
                      </div>
                    </div>
                    {pendencia && (
                      <div className="text-xs">
                        <p className="text-muted-foreground">Última pendência:</p>
                        <p className="text-orange-600 font-medium truncate">{pendencia}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
