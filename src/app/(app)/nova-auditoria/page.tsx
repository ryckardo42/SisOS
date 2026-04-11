"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ClipboardCheck, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NovaAuditoriaPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fiscalizada: "",
    municipio: "",
    data_inicio: "",
    data_vencimento: "",   // MM/AA
    ri: "",
    os: "",
    cnpj: "",
    me_epp: false,
    acidente_trabalho: false,
    embargo_interdicao: "",
  });

  // MM/AA → YYYY-MM-01
  function mmaaToIso(mmaa: string): string | null {
    const clean = mmaa.replace(/\D/g, "");
    if (clean.length !== 4) return null;
    return `20${clean.slice(2, 4)}-${clean.slice(0, 2)}-01`;
  }

  // dd/mm/aa → YYYY-MM-DD
  function ddmmyyToIso(val: string): string | null {
    const digits = val.replace(/\D/g, "");
    if (digits.length !== 6) return null;
    return `20${digits.slice(4, 6)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
  }

  // Auto-formata vencimento MM/AA
  function handleVencimento(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    update("data_vencimento", formatted);
  }

  // Auto-formata data dd/mm/aa
  function handleDataInicio(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    update("data_inicio", formatted);
  }
  const router = useRouter();
  const supabase = createClient();

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fiscalizada.trim()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("auditorias")
      .insert({
        user_id: user.id,
        fiscalizada: form.fiscalizada.trim(),
        municipio: form.municipio.trim() || null,
        data_inicio: ddmmyyToIso(form.data_inicio),
        data_vencimento: mmaaToIso(form.data_vencimento),
        ri: form.ri.trim() || null,
        os: form.os.trim() || null,
        cnpj: form.cnpj.trim() || null,
        me_epp: form.me_epp,
        acidente_trabalho: form.acidente_trabalho,
        embargo_interdicao: form.embargo_interdicao.trim() || null,
      })
      .select()
      .single();

    if (error) {
      alert("Erro ao criar auditoria: " + error.message);
      setLoading(false);
      return;
    }

    router.push(`/auditoria/${data.id}`);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nova Auditoria</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova empresa para fiscalização
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-blue-600" />
            Dados da Fiscalizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fiscalizada */}
              <div className="space-y-2">
                <Label htmlFor="fiscalizada">Fiscalizada *</Label>
                <Input
                  id="fiscalizada"
                  placeholder="Ex: DALU"
                  value={form.fiscalizada}
                  onChange={(e) => update("fiscalizada", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Campo obrigatório</p>
              </div>

              {/* Município */}
              <div className="space-y-2">
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  placeholder="Ex: São Paulo"
                  value={form.municipio}
                  onChange={(e) => update("municipio", e.target.value)}
                />
              </div>

              {/* Data de Início */}
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início</Label>
                <Input
                  id="data_inicio"
                  placeholder="dd/mm/aa"
                  value={form.data_inicio}
                  onChange={(e) => handleDataInicio(e.target.value)}
                  maxLength={8}
                />
              </div>

              {/* Vencimento MM/AA */}
              <div className="space-y-2">
                <Label htmlFor="data_vencimento">Vencimento (MM/AA)</Label>
                <Input
                  id="data_vencimento"
                  placeholder="Ex: 04/26"
                  value={form.data_vencimento}
                  onChange={(e) => handleVencimento(e.target.value)}
                  maxLength={5}
                />
              </div>

              {/* RI */}
              <div className="space-y-2">
                <Label htmlFor="ri">Relatório de Inspeção (RI)</Label>
                <Input
                  id="ri"
                  placeholder="Até 14 dígitos numéricos"
                  value={form.ri}
                  onChange={(e) => update("ri", e.target.value)}
                  maxLength={14}
                />
              </div>

              {/* OS */}
              <div className="space-y-2">
                <Label htmlFor="os">Ordem de Serviço (OS)</Label>
                <Input
                  id="os"
                  placeholder="Até 14 dígitos"
                  value={form.os}
                  onChange={(e) => update("os", e.target.value)}
                  maxLength={14}
                />
              </div>

              {/* CNPJ */}
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="Formato livre"
                  value={form.cnpj}
                  onChange={(e) => update("cnpj", e.target.value)}
                />
              </div>
            </div>

            {/* ME/EPP + Acidente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label>Empresa é ME/EPP?</Label>
                <RadioGroup
                  value={form.me_epp ? "sim" : "nao"}
                  onValueChange={(v) => update("me_epp", v === "sim")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="me_sim" />
                    <Label htmlFor="me_sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="me_nao" />
                    <Label htmlFor="me_nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Acidente do Trabalho</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acidente"
                    checked={form.acidente_trabalho}
                    onCheckedChange={(c) => update("acidente_trabalho", !!c)}
                  />
                  <Label htmlFor="acidente" className="text-sm text-muted-foreground">
                    Marque se a auditoria é relacionada a acidente do trabalho
                  </Label>
                </div>
              </div>
            </div>

            {/* Embargo/Interdição */}
            <div className="space-y-2">
              <Label htmlFor="embargo">Embargo/Interdição</Label>
              <Textarea
                id="embargo"
                placeholder="Campo livre para anotações sobre embargo ou interdição"
                value={form.embargo_interdicao}
                onChange={(e) => update("embargo_interdicao", e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/">
                <Button type="button" variant="outline">Cancelar</Button>
              </Link>
              <Button type="submit" disabled={loading || !form.fiscalizada.trim()}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Criar Auditoria
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
