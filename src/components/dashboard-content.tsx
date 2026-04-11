"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, MapPin, Plus, ArrowRight, Bell, LayoutGrid } from "lucide-react";
import Link from "next/link";
import type { Auditoria } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardContentProps {
  userName: string;
  auditorias: Auditoria[];
  finalizadasCount: number;
}

function toMmaa(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

function formatDateBR(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function isVencendoEsteMes(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isVencida(dateStr: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  return (
    d.getFullYear() < now.getFullYear() ||
    (d.getFullYear() === now.getFullYear() && d.getMonth() < now.getMonth())
  );
}

// DET vencida = data_entrega < hoje E conferido = false
function hasDETVencida(a: Auditoria): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (a.dets || []).some((d) => {
    if (!d.data_entrega || d.conferido) return false;
    const entrega = new Date(d.data_entrega + "T00:00:00");
    return entrega < today;
  });
}

function getStatusLabel(a: Auditoria) {
  if (isVencida(a.data_vencimento)) return { label: "Vencida", color: "bg-red-100 text-red-600" };
  if (isVencendoEsteMes(a.data_vencimento)) return { label: "⚠ Vence este mês", color: "bg-red-100 text-red-700" };
  return { label: "Em Andamento", color: "bg-teal-100 text-teal-700" };
}

function getDETDate(a: Auditoria) {
  const dets = a.dets || [];
  if (dets.length === 0) return null;
  const last = [...dets].sort((x, y) => (x.created_at > y.created_at ? -1 : 1))[0];
  return formatDateBR(last.data_entrega);
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

function getProgress(a: Auditoria) {
  const total = (a.pendencias || []).length;
  const done = (a.pendencias || []).filter((p) => p.realizada).length;
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

// Gradientes holográficos iridescentes — estilo da referência
const holoGradients = [
  "linear-gradient(135deg, #fce4ec 0%, #f8bbd9 30%, #e1f5fe 65%, #e8f5e9 100%)",
  "linear-gradient(135deg, #e8f5e9 0%, #b2dfdb 30%, #e3f2fd 65%, #f3e5f5 100%)",
  "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 30%, #fff9c4 65%, #fce4ec 100%)",
];

export function DashboardContent({ userName, auditorias, finalizadasCount }: DashboardContentProps) {
  const total = auditorias.length + finalizadasCount;
  const pctAndamento = total > 0 ? Math.round((auditorias.length / total) * 100) : 0;
  const pctConcluidas = total > 0 ? Math.round((finalizadasCount / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-[#f4f6f9]">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <LayoutGrid className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">
              Sistema de Gestão de Auditorias
            </h1>
            <p className="text-xs text-gray-400 font-normal">
              Bem-vindo, <span className="font-medium text-indigo-600">{userName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center ring-2 ring-indigo-100">
            <span className="text-sm font-semibold text-white">{userName[0].toUpperCase()}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        {/* Stats Cards — estilo holográfico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {/* Card 1 — Em Andamento */}
          <Card className="border-0 shadow-sm overflow-hidden rounded-2xl">
            <div className="h-28 relative" style={{ background: holoGradients[0] }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Clock className="h-16 w-16 text-pink-400" />
              </div>
            </div>
            <CardContent className="pt-4 pb-5 bg-white">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Em Andamento
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-0.5 leading-none">{auditorias.length}</p>
              <p className="text-xs text-gray-400 mt-1">Auditorias ativas</p>
              <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-pink-400 rounded-full" style={{ width: `${pctAndamento}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Card 2 — Concluídas */}
          <Card className="border-0 shadow-sm overflow-hidden rounded-2xl">
            <div className="h-28 relative" style={{ background: holoGradients[1] }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <CheckCircle2 className="h-16 w-16 text-teal-500" />
              </div>
            </div>
            <CardContent className="pt-4 pb-5 bg-white">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Concluídas
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-0.5 leading-none">{finalizadasCount}</p>
              <p className="text-xs text-gray-400 mt-1">Auditorias finalizadas</p>
              <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 rounded-full" style={{ width: `${pctConcluidas}%` }} />
              </div>
            </CardContent>
          </Card>

          {/* Card 3 — Total */}
          <Card className="border-0 shadow-sm overflow-hidden rounded-2xl">
            <div className="h-28 relative" style={{ background: holoGradients[2] }}>
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <span className="text-7xl font-black text-violet-400">Σ</span>
              </div>
            </div>
            <CardContent className="pt-4 pb-5 bg-white">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                Total Geral
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-0.5 leading-none">{total}</p>
              <p className="text-xs text-gray-400 mt-1">Todas as auditorias</p>
              <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-400 rounded-full" style={{ width: "100%" }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Auditorias em Andamento</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {auditorias.length} {auditorias.length === 1 ? "auditoria ativa" : "auditorias ativas"}
            </p>
          </div>
          <Link href="/nova-auditoria">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-xs px-4"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Nova Auditoria
            </Button>
          </Link>
        </div>

        {/* Cards Grid */}
        {auditorias.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="py-16 text-center">
              <p className="text-gray-400 mb-4 text-sm">Nenhuma auditoria em andamento.</p>
              <Link href="/nova-auditoria">
                <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm">
                  Criar primeira auditoria
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {auditorias.map((a) => {
              const status = getStatusLabel(a);
              const progress = getProgress(a);
              const detDate = getDETDate(a);
              const lastUpdate = getLastUpdate(a);
              const pendencia = getLastPendencia(a);
              const vencendoEsteMes = isVencendoEsteMes(a.data_vencimento);
              const detVencida = hasDETVencida(a);

              // Prioridade: vermelho (vencendo mês) > amarelo (DET vencida) > normal
              const cardBg = vencendoEsteMes
                ? "bg-red-50 ring-2 ring-red-300"
                : detVencida
                ? "bg-yellow-50 ring-2 ring-yellow-300"
                : "";

              const bannerGradient = vencendoEsteMes
                ? "linear-gradient(90deg, #ef4444, #f87171, #ef4444)"
                : detVencida
                ? "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)"
                : "linear-gradient(90deg, #818cf8, #a78bfa, #6366f1)";

              const avatarStyle = vencendoEsteMes
                ? { background: "linear-gradient(135deg, #fee2e2, #fecaca)", color: "#991b1b" }
                : detVencida
                ? { background: "linear-gradient(135deg, #fef9c3, #fef08a)", color: "#92400e" }
                : { background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)", color: "#4338ca" };

              const footerBorder = vencendoEsteMes
                ? "border-red-100"
                : detVencida
                ? "border-yellow-100"
                : "border-gray-100";

              return (
                <Link key={a.id} href={`/auditoria/${a.id}`}>
                  <Card
                    className={`shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer h-full group rounded-2xl border-0 ${cardBg}`}
                  >
                    {/* Banner topo */}
                    <div
                      className="h-2 rounded-t-2xl"
                      style={{ background: bannerGradient }}
                    />

                    <CardContent className="pt-4 pb-4 flex flex-col h-full rounded-b-2xl">
                      {/* Top row */}
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                          style={avatarStyle}
                        >
                          {a.fiscalizada.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                          {detVencida && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-900 flex items-center gap-1">
                              ❗DET não visto
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="mb-3">
                        {a.me_epp && (
                          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider mr-1">
                            ME/EPP
                          </span>
                        )}
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{a.fiscalizada}</h3>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500 mb-3">
                        {a.ri && (
                          <div>
                            <span className="text-gray-400">RI:</span>{" "}
                            <span className="font-medium text-gray-700">{a.ri}</span>
                          </div>
                        )}
                        {a.municipio && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-700 truncate">{a.municipio}</span>
                          </div>
                        )}
                        {detDate && (
                          <div>
                            <span className="text-gray-400">DET:</span>{" "}
                            <span className={`font-semibold ${detVencida ? "text-yellow-700" : "text-indigo-500"}`}>
                              {detDate}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-400">Atualiz.:</span>{" "}
                          <span className="font-medium text-gray-600">{lastUpdate}</span>
                        </div>
                      </div>

                      {/* Pendência */}
                      {pendencia && (
                        <p className="text-[11px] text-amber-600 font-medium truncate mb-3 bg-amber-50 px-2 py-1 rounded-lg">
                          ⚠ {pendencia}
                        </p>
                      )}

                      {/* Progress */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-gray-400 font-medium">Progresso</span>
                          <span className="text-[10px] font-bold text-gray-600">{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${progress}%`,
                              background:
                                progress === 100
                                  ? "#34d399"
                                  : progress > 50
                                  ? "#818cf8"
                                  : "#fb923c",
                            }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className={`flex items-center justify-between mt-3 pt-3 border-t ${footerBorder}`}>
                        <div className="text-[11px] text-gray-400">
                          {a.data_vencimento && (
                            <>
                              Vence:{" "}
                              <span className={`font-bold ${vencendoEsteMes ? "text-red-600" : "text-gray-700"}`}>
                                {toMmaa(a.data_vencimento)}
                              </span>
                            </>
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
