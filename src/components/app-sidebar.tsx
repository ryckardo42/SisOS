"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Plus, LogOut, ClipboardCheck,
  LayoutDashboard, CheckCircle2, Settings, HelpCircle, ChevronDown, ChevronRight,
  ExternalLink, Globe, Mail, BookOpen, BarChart2, FileText, Layers,
} from "lucide-react";
import Link from "next/link";
import type { Auditoria } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [search, setSearch] = useState("");
  const [auditoriasOpen, setAuditoriasOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    loadAuditorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAuditorias() {
    const { data } = await supabase
      .from("auditorias")
      .select("*")
      .eq("status", "em_andamento")
      .order("data_inicio", { ascending: false });
    if (data) setAuditorias(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const filtered = auditorias.filter(
    (a) =>
      a.fiscalizada.toLowerCase().includes(search.toLowerCase()) ||
      (a.ri && a.ri.includes(search))
  );

  const isActive = (path: string) => pathname === path;

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 cursor-pointer transition-all text-sm font-medium ${
      active
        ? "bg-white/20 text-white"
        : "text-blue-200 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <div className="w-64 flex flex-col h-full text-white"
      style={{ background: "linear-gradient(180deg, #1a237e 0%, #283593 100%)" }}>

      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <ClipboardCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg leading-none">SisOS</p>
            <p className="text-blue-300 text-xs mt-0.5">Gestão de Auditorias</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-300" />
          <input
            placeholder="Buscar auditoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/10 text-white placeholder-blue-300 border border-white/10 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* Main Menu */}
      <nav className="flex-1 overflow-y-auto py-2">
        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest px-6 mb-2 mt-2">
          Menu Principal
        </p>

        <Link href="/" className={navItemClass(pathname === "/" )}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          Dashboard
        </Link>

        {/* Auditorias collapsible */}
        <div>
          <button
            onClick={() => setAuditoriasOpen(!auditoriasOpen)}
            className={`${navItemClass(false)} w-full justify-between`}
          >
            <div className="flex items-center gap-3">
              <ClipboardCheck className="h-4 w-4 shrink-0" />
              Auditorias
              {auditorias.length > 0 && (
                <span className="ml-auto bg-white/20 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">
                  {auditorias.length}
                </span>
              )}
            </div>
            {auditoriasOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {auditoriasOpen && (
            <div className="ml-4 mt-1 space-y-0.5">
              {/* Sub-items */}
              <Link
                href="/"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl mx-2 text-xs transition-all ${
                  pathname === "/" ? "text-white font-medium" : "text-blue-300 hover:text-white"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                Em Andamento
              </Link>
              <Link
                href="/finalizadas"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl mx-2 text-xs transition-all ${
                  pathname === "/finalizadas" ? "text-white font-medium" : "text-blue-300 hover:text-white"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                Finalizadas
              </Link>
            </div>
          )}
        </div>

        <Link href="/finalizadas" className={navItemClass(isActive("/finalizadas") && !auditoriasOpen)}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Concluídas
        </Link>

        <Link href="/nova-auditoria" className={navItemClass(isActive("/nova-auditoria"))}>
          <Plus className="h-4 w-4 shrink-0" />
          Nova Auditoria
        </Link>

        {/* Links section */}
        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest px-6 mb-2 mt-6">
          Links
        </p>

        {[
          { label: "SFITWEB", href: "https://sfitweb.mte.gov.br/sfitweb/private/pages/principal.jsf", icon: <Globe className="h-4 w-4 shrink-0" /> },
          { label: "DET", href: "https://auditor-det.sit.trabalho.gov.br/login", icon: <FileText className="h-4 w-4 shrink-0" /> },
          { label: "E-mail", href: "https://outlook.cloud.microsoft/mail/?culture=pt-br&country=br", icon: <Mail className="h-4 w-4 shrink-0" /> },
          { label: "PortalAFT", href: "https://portalaft.sit.trabalho.gov.br/", icon: <Layers className="h-4 w-4 shrink-0" /> },
          { label: "PainelSIT", href: "https://app.powerbi.com/groups/me/apps/11afb887-38d3-449d-ad75-510f19e0c48f/reports/c2692b87-8ab3-48f3-b1f6-1bc09232c799/795e2e0f7b20c09034ab?ctid=3ec92969-5a51-4f18-8ac9-ef98fbafa978&experience=power-bi", icon: <BarChart2 className="h-4 w-4 shrink-0" /> },
          { label: "NRs", href: "https://www.gov.br/trabalho-e-emprego/pt-br/acesso-a-informacao/participacao-social/conselhos-e-orgaos-colegiados/comissao-tripartite-partitaria-permanente/normas-regulamentadora/normas-regulamentadoras-vigentes", icon: <BookOpen className="h-4 w-4 shrink-0" /> },
          { label: "NotebooksLM", href: "https://notebooks-aft.vercel.app", icon: <ExternalLink className="h-4 w-4 shrink-0" /> },
        ].map(({ label, href, icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl mx-2 cursor-pointer transition-all text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white"
          >
            {icon}
            <span>{label}</span>
            <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
          </a>
        ))}

        {/* Settings section */}
        <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest px-6 mb-2 mt-6">
          Configurações
        </p>

        <button className={navItemClass(false) + " w-full"}>
          <HelpCircle className="h-4 w-4 shrink-0" />
          Ajuda
        </button>

        <button className={navItemClass(false) + " w-full"}>
          <Settings className="h-4 w-4 shrink-0" />
          Configurações
        </button>

        <button onClick={handleLogout} className={navItemClass(false) + " w-full"}>
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">
              {(user.email?.[0] ?? "U").toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.email?.split("@")[0]}
            </p>
            <p className="text-xs text-blue-300 truncate">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
