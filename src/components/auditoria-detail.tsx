"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Pencil, Trash2, CheckCircle2, Plus, ArrowRight,
  ClipboardCheck, Shield, AlertTriangle, Activity, ListChecks, FileText
} from "lucide-react";
import Link from "next/link";
import type { Auditoria, DET, Auto, Atualizacao, Pendencia } from "@/lib/types";

interface Props {
  auditoria: Auditoria;
}

function formatDateBR(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR");
}

// Converte YYYY-MM-DD → MM/AA
function toMmaa(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
}

// Converte MM/AA → YYYY-MM-01
function mmaaToIso(mmaa: string): string | null {
  const clean = mmaa.replace(/\D/g, "");
  if (clean.length !== 4) return null;
  return `20${clean.slice(2, 4)}-${clean.slice(0, 2)}-01`;
}

export function AuditoriaDetail({ auditoria: initial }: Props) {
  const [auditoria, setAuditoria] = useState(initial);
  const [editingBasic, setEditingBasic] = useState(false);
  const [editingEmbargo, setEditingEmbargo] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function refresh() {
    const { data } = await supabase
      .from("auditorias")
      .select("*, dets(*), autos(*), atualizacoes(*), pendencias(*)")
      .eq("id", auditoria.id)
      .single();
    if (data) setAuditoria(data);
  }

  async function handleDelete() {
    if (!confirm("Tem certeza que deseja excluir esta auditoria?")) return;
    await supabase.from("auditorias").delete().eq("id", auditoria.id);
    router.push("/");
  }

  async function handleFinalize() {
    if (!confirm("Finalizar esta auditoria?")) return;
    await supabase
      .from("auditorias")
      .update({ status: "finalizada" })
      .eq("id", auditoria.id);
    router.push("/");
  }

  const pendentes = (auditoria.autos || []).filter((a) => !a.lavrado);
  const lavrados = (auditoria.autos || []).filter((a) => a.lavrado);
  const pendenciasPendentes = (auditoria.pendencias || []).filter((p) => !p.realizada);
  const pendenciasRealizadas = (auditoria.pendencias || []).filter((p) => p.realizada);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{auditoria.fiscalizada}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                Em Andamento
              </Badge>
              {auditoria.data_inicio && (
                <span className="text-sm text-muted-foreground">
                  Iniciada em {formatDateBR(auditoria.data_inicio)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-red-600" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleFinalize}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Finalizar Auditoria
          </Button>
        </div>
      </div>

      {/* Last pendencia banner */}
      {pendenciasPendentes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-sm">
          <span className="text-red-600 font-medium">
            Última pendência adicionada: {pendenciasPendentes[pendenciasPendentes.length - 1].descricao}
          </span>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Básicos */}
        <DadosBasicosCard
          auditoria={auditoria}
          editing={editingBasic}
          setEditing={setEditingBasic}
          onSave={refresh}
        />

        {/* DETs */}
        <DETsCard auditoria={auditoria} onRefresh={refresh} />

        {/* Embargo/Interdição */}
        <EmbargoCard
          auditoria={auditoria}
          editing={editingEmbargo}
          setEditing={setEditingEmbargo}
          onSave={refresh}
        />

        {/* Atualizações */}
        <AtualizacoesCard auditoria={auditoria} onRefresh={refresh} />

        {/* Autos de Infração */}
        <AutosCard
          pendentes={pendentes}
          lavrados={lavrados}
          auditoriaId={auditoria.id}
          onRefresh={refresh}
        />

        {/* Pendências */}
        <PendenciasCard
          pendentes={pendenciasPendentes}
          realizadas={pendenciasRealizadas}
          auditoriaId={auditoria.id}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}

// ========== Dados Básicos ==========
function DadosBasicosCard({
  auditoria,
  editing,
  setEditing,
  onSave,
}: {
  auditoria: Auditoria;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onSave: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState({
    fiscalizada: auditoria.fiscalizada,
    municipio: auditoria.municipio || "",
    data_inicio: auditoria.data_inicio || "",
    data_vencimento: toMmaa(auditoria.data_vencimento), // MM/AA
    ri: auditoria.ri || "",
    os: auditoria.os || "",
    cnpj: auditoria.cnpj || "",
    me_epp: auditoria.me_epp,
    acidente_trabalho: auditoria.acidente_trabalho,
  });

  function handleVencimento(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    setForm({ ...form, data_vencimento: formatted });
  }

  async function save() {
    await supabase
      .from("auditorias")
      .update({
        fiscalizada: form.fiscalizada,
        municipio: form.municipio || null,
        data_inicio: form.data_inicio || null,
        data_vencimento: mmaaToIso(form.data_vencimento),
        ri: form.ri || null,
        os: form.os || null,
        cnpj: form.cnpj || null,
        me_epp: form.me_epp,
        acidente_trabalho: form.acidente_trabalho,
      })
      .eq("id", auditoria.id);
    setEditing(false);
    onSave();
  }

  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
            Editar Dados Básicos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fiscalizada</Label>
              <Input value={form.fiscalizada} onChange={(e) => setForm({ ...form, fiscalizada: e.target.value })} />
            </div>
            <div>
              <Label>Município</Label>
              <Input value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value })} />
            </div>
            <div>
              <Label>Data de Início</Label>
              <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
            </div>
            <div>
              <Label>Vencimento (MM/AA)</Label>
              <Input placeholder="Ex: 04/26" value={form.data_vencimento} onChange={(e) => handleVencimento(e.target.value)} maxLength={5} />
            </div>
            <div>
              <Label>RI</Label>
              <Input value={form.ri} onChange={(e) => setForm({ ...form, ri: e.target.value })} />
            </div>
            <div>
              <Label>OS</Label>
              <Input value={form.os} onChange={(e) => setForm({ ...form, os: e.target.value })} />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button size="sm" onClick={save}>Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          Dados Básicos
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3 w-3 mr-1" />
          Editar
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Fiscalizada</p>
            <p className="font-medium">{auditoria.fiscalizada}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Município</p>
            <p className="font-medium">{auditoria.municipio || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Data de Início</p>
            <p className="font-medium">{formatDateBR(auditoria.data_inicio)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Vencimento</p>
            <p className="font-medium">{toMmaa(auditoria.data_vencimento) || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">RI</p>
            <p className="font-medium">{auditoria.ri || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">OS</p>
            <p className="font-medium">{auditoria.os || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">CNPJ</p>
            <p className="font-medium">{auditoria.cnpj || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ME/EPP</p>
            <p className="font-medium">{auditoria.me_epp ? "Sim" : "Não"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Acidente do Trabalho</p>
            <p className="font-medium">{auditoria.acidente_trabalho ? "Sim" : "Não"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== DETs ==========
function DETsCard({ auditoria, onRefresh }: { auditoria: Auditoria; onRefresh: () => void }) {
  const supabase = createClient();
  const [codigo, setCodigo] = useState("");
  const [dataNotificacao, setDataNotificacao] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const dets = auditoria.dets || [];

  async function addDET() {
    if (!codigo.trim()) return;
    await supabase.from("dets").insert({
      auditoria_id: auditoria.id,
      codigo: codigo.trim(),
      data_notificacao: dataNotificacao || null,
      data_entrega: dataEntrega || null,
    });
    setCodigo("");
    setDataNotificacao("");
    setDataEntrega("");
    onRefresh();
  }

  async function deleteDET(id: string) {
    await supabase.from("dets").delete().eq("id", id);
    onRefresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-600" />
          Notificações DET
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <div>
            <Label>Código da DET</Label>
            <Input placeholder="Ex: ROCH7OZ5MH238R" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Data da Notificação</Label>
              <Input type="date" value={dataNotificacao} onChange={(e) => setDataNotificacao(e.target.value)} />
            </div>
            <div>
              <Label>Data da Entrega</Label>
              <Input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={addDET} disabled={!codigo.trim()}>
              Adicionar DET
            </Button>
          </div>
        </div>

        {/* List */}
        {dets.map((det) => (
          <div key={det.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
            <div>
              <Badge className="bg-green-600">{det.codigo}</Badge>
              <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                {det.data_notificacao && <span>Notificação: {formatDateBR(det.data_notificacao)}</span>}
                {det.data_entrega && <span>Entrega: {formatDateBR(det.data_entrega)}</span>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteDET(det.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {dets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">Nenhuma DET registrada</p>
        )}
      </CardContent>
    </Card>
  );
}

// ========== Embargo/Interdição ==========
function EmbargoCard({
  auditoria,
  editing,
  setEditing,
  onSave,
}: {
  auditoria: Auditoria;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onSave: () => void;
}) {
  const supabase = createClient();
  const [text, setText] = useState(auditoria.embargo_interdicao || "");

  async function save() {
    await supabase
      .from("auditorias")
      .update({ embargo_interdicao: text.trim() || null })
      .eq("id", auditoria.id);
    setEditing(false);
    onSave();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          Embargo/Interdição
        </CardTitle>
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-3">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Anotações sobre embargo ou interdição..." />
            <div className="flex gap-2">
              <Button size="sm" onClick={save}>Salvar</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-orange-50 p-3 rounded-lg mb-3 min-h-[60px]">
              <p className="text-sm">{auditoria.embargo_interdicao || "Nenhum embargo/interdição registrado"}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3 mr-1" />
                Editar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== Autos de Infração ==========
function AutosCard({
  pendentes,
  lavrados,
  auditoriaId,
  onRefresh,
}: {
  pendentes: Auto[];
  lavrados: Auto[];
  auditoriaId: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [newAuto, setNewAuto] = useState("");

  async function addAuto() {
    if (!newAuto.trim()) return;
    await supabase.from("autos").insert({
      auditoria_id: auditoriaId,
      descricao: newAuto.trim(),
    });
    setNewAuto("");
    onRefresh();
  }

  async function toggleLavrado(auto: Auto) {
    await supabase.from("autos").update({ lavrado: !auto.lavrado }).eq("id", auto.id);
    onRefresh();
  }

  async function deleteAuto(id: string) {
    await supabase.from("autos").delete().eq("id", id);
    onRefresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Autos de Infração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add */}
        <div className="flex gap-2">
          <Input
            placeholder="Digite um auto de infração e pressione Enter"
            value={newAuto}
            onChange={(e) => setNewAuto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addAuto()}
          />
          <Button size="icon" onClick={addAuto}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Pendentes */}
        <div>
          <p className="text-sm font-medium flex items-center gap-1 mb-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Pendentes ({pendentes.length})
          </p>
          {pendentes.map((auto) => (
            <div key={auto.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg mb-1">
              <div className="flex items-center gap-2">
                <Checkbox checked={false} onCheckedChange={() => toggleLavrado(auto)} />
                <span className="text-sm">{auto.descricao}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteAuto(auto.id)}>
                <ArrowRight className="h-4 w-4 text-orange-500" />
              </Button>
            </div>
          ))}
          {pendentes.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum auto pendente</p>
          )}
        </div>

        <Separator />

        {/* Lavrados */}
        <div>
          <p className="text-sm font-medium flex items-center gap-1 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Lavrados ({lavrados.length})
          </p>
          {lavrados.map((auto) => (
            <div key={auto.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg mb-1">
              <div className="flex items-center gap-2">
                <Checkbox checked={true} onCheckedChange={() => toggleLavrado(auto)} />
                <span className="text-sm line-through text-muted-foreground">{auto.descricao}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => deleteAuto(auto.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {lavrados.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum auto de infração lavrado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Atualizações ==========
function AtualizacoesCard({ auditoria, onRefresh }: { auditoria: Auditoria; onRefresh: () => void }) {
  const supabase = createClient();
  const [text, setText] = useState("");
  const atualizacoes = auditoria.atualizacoes || [];

  async function add() {
    if (!text.trim()) return;
    await supabase.from("atualizacoes").insert({
      auditoria_id: auditoria.id,
      texto: text.trim(),
    });
    setText("");
    onRefresh();
  }

  async function remove(id: string) {
    await supabase.from("atualizacoes").delete().eq("id", id);
    onRefresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-600" />
          Atualizações ({atualizacoes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="Digite uma atualização das atividades do dia"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <Button size="icon" onClick={add}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {atualizacoes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma atualização registrada</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-auto">
            {[...atualizacoes].reverse().map((at) => (
              <div key={at.id} className="flex items-start justify-between p-2 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm">{at.texto}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(at.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400" onClick={() => remove(at.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ========== Pendências ==========
function PendenciasCard({
  pendentes,
  realizadas,
  auditoriaId,
  onRefresh,
}: {
  pendentes: Pendencia[];
  realizadas: Pendencia[];
  auditoriaId: string;
  onRefresh: () => void;
}) {
  const supabase = createClient();
  const [text, setText] = useState("");

  async function add() {
    if (!text.trim()) return;
    await supabase.from("pendencias").insert({
      auditoria_id: auditoriaId,
      descricao: text.trim(),
    });
    setText("");
    onRefresh();
  }

  async function toggle(p: Pendencia) {
    await supabase.from("pendencias").update({ realizada: !p.realizada }).eq("id", p.id);
    onRefresh();
  }

  async function remove(id: string) {
    await supabase.from("pendencias").delete().eq("id", id);
    onRefresh();
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-blue-600" />
          Pendências
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pendentes */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Digite uma pendência e pressione Enter"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <Button size="icon" onClick={add}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-sm font-medium flex items-center gap-1">
              <ListChecks className="h-4 w-4" />
              Pendentes ({pendentes.length})
            </p>
            {pendentes.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox checked={false} onCheckedChange={() => toggle(p)} />
                  <span className="text-sm">{p.descricao}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(p.id)}>
                  <ArrowRight className="h-4 w-4 text-orange-500" />
                </Button>
              </div>
            ))}
            {pendentes.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma pendência</p>
            )}
          </div>

          {/* Realizadas */}
          <div className="space-y-3">
            <p className="text-sm font-medium flex items-center gap-1 mt-10 md:mt-0">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Realizado ({realizadas.length})
            </p>
            {realizadas.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Checkbox checked={true} onCheckedChange={() => toggle(p)} />
                  <span className="text-sm line-through text-muted-foreground">{p.descricao}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => remove(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {realizadas.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma pendência realizada</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
