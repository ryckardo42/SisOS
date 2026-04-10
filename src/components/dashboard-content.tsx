"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, MapPin, Plus, ArrowRight, Bell, Menu } from "lucide-react";
import Link from "next/link";
import type { Auditoria } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardContentProps {
  userName: string;
  auditorias: Auditoria[];
  finalizadasCount: number;
}

function formatDateBR(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function isVencida(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr + "T00:00:00") < new Date();
}

function isVenceSemana(dateStr: string | null) {
  if (!dateStr) return false;
  const diff = new Date(dateStr + "T00:00:00").getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function getStatusLabel(a: Auditoria) {
  if (isVencida(a.data_vencimento)) return { label: "Vencida", color: "bg-red-100 text-red-700" };
  if (isVenceSemana(a.data_vencimento)) return { label: "Vence em breve", color: "bg-yellow-100 text-yellow-700" };
  return { label: "Em Andamento", color: "bg-teal-100 text-teal-700" };
}

function getDETDate(a: Auditoria) {
  const dets = a.dets || [];
  if (dets.length === 0) return null;
  const last = [...dets].sort((x, y) => (x.created_at > y.created_at ? -1 : 1))[0];
  return formatDateBR(last.data_notificacao);
}

function getLastUpdate(a: Auditoria) {
  const dates = [
    ...(a.atualizacoes || []).map((u) => u.created_at),
    a.updated_at,
  ].filter(Boolean);
  const latest = dates.sort().reverse()[0];
  if (!latest) return "Sem atividade";
  return formatDistanceToNow(new Date(latest), { locale: ptBR, addSuffix: true });
}

function getLastPendencia(a: Auditoria) {
  const pending = (a.pendencias || []).filter((p) => !p.realizada);
  if (pending.length === 0) return null;
  return pending[pending.length - 1]?.descricao;
}

// Progress: simula progresso com base em pendências resolvidas vs total
function getProgress(a: Auditoria) {
  const total = (a.pendencias || []).length;
  const done = (a.pendencias || []).filter((p) => p.realizada).length;
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function DashboardContent({ userName, auditorias, finalizadasCount }: DashboardContentProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-gray-600">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-400">Bem-vindo, <span className="font-medium text-indigo-600">{userName}</span>! Gerencie suas fiscalizações</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative text-gray-400 hover:text-gray-600">
            <Bell className="h-5 w-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-sm font-bold text-indigo-700">{userName[0].toUpperCase()}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Em Andamento</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{auditorias.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Auditorias ativas</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <div className="mt-3 h-1 bg-orange-100 rounded-full">
                <div className="h-1 bg-orange-400 rounded-full" style={{ width: "60%" }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Concluídas</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{finalizadasCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Auditorias finalizadas</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-3 h-1 bg-green-100 rounded-full">
                <div className="h-1 bg-green-400 rounded-full" style={{ width: "80%" }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Geral</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{auditorias.length + finalizadasCount}</p>
                  <p className="text-xs text-gray-400 mt-1">Todas as auditorias</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-indigo-600">Σ</span>
                </div>
              </div>
              <div className="mt-3 h-1 bg-indigo-100 rounded-full">
                <div className="h-1 bg-indigo-400 rounded-full" style={{ width: "100%" }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Auditorias em Andamento
            </h2>
            <p className="text-sm text-gray-400">Organizadas da mais antiga para a mais recente</p>
          </div>
          <Link href="/nova-auditoria">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
              <Plus className="h-4 w-4 mr-1" /> Nova Auditoria
            </Button>
          </Link>
        </div>

        {/* Cards Grid */}
        {auditorias.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <p className="text-gray-400 mb-4">Nenhuma auditoria em andamento.</p>
              <Link href="/nova-auditoria">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Criar primeira auditoria</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {auditorias.map((a) => {
              const status = getStatusLabel(a);
              const progress = getProgress(a);
              const detDate = getDETDate(a);
              const lastUpdate = getLastUpdate(a);
              const pendencia = getLastPendencia(a);

              return (
                <Link key={a.id} href={`/auditoria/${a.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group">
                    <CardContent className="pt-5 pb-4 flex flex-col h-full">
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-indigo-700">
                            {a.fiscalizada.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Title */}
                      <div className="mb-1">
                        {a.me_epp && (
                          <span className="text-[10px] font-bold text-indigo-400 uppercase mr-1">ME/EPP</span>
                        )}
                        <h3 className="font-bold text-gray-800 text-sm leading-snug">{a.fiscalizada}</h3>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500 mb-3 mt-2">
                        {a.ri && (
                          <div>
                            <span className="text-gray-400">RI:</span>{" "}
                            <span className="font-medium text-gray-600">{a.ri}</span>
                          </div>
                        )}
                        {a.municipio && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="font-medium text-gray-600 truncate">{a.municipio}</span>
                          </div>
                        )}
                        {detDate && (
                          <div>
                            <span className="text-gray-400">DET:</span>{" "}
                            <span className="font-semibold text-indigo-600">{detDate}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Atualiz.:</span>{" "}
                          <span className="font-medium text-gray-600">{lastUpdate}</span>
                        </div>
                      </div>

                      {/* Pendência */}
                      {pendencia && (
                        <p className="text-xs text-orange-500 font-medium truncate mb-3">
                          ⚠ {pendencia}
                        </p>
                      )}

                      {/* Progress bar */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-gray-400">Progresso das pendências</span>
                          <span className="text-[10px] font-bold text-gray-600">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              background: progress === 100
                                ? "#22c55e"
                                : progress > 50
                                ? "#6366f1"
                                : "#f97316",
                            }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <div className="text-[11px] text-gray-400">
                          {a.data_vencimento && (
                            <>Vence: <span className="font-medium text-gray-600">{formatDateBR(a.data_vencimento)}</span></>
                          )}
                        </div>
                        <span className="text-[11px] text-indigo-500 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                          Abrir <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
