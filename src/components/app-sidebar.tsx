"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, LogOut, ClipboardCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Auditoria } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface AppSidebarProps {
  user: User;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    loadAuditorias();
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

  // Group by month/year of data_inicio
  const grouped = filtered.reduce<Record<string, Auditoria[]>>((acc, a) => {
    const date = a.data_inicio ? new Date(a.data_inicio + "T00:00:00") : null;
    const key = date
      ? `${date.toLocaleString("pt-BR", { month: "long" })} ${date.getFullYear()}`
      : "Sem data";
    if (!acc[key]) acc[key] = [];
    acc[key].push(a);
    return acc;
  }, {});

  return (
    <div className="w-64 bg-white border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardCheck className="h-5 w-5 text-blue-600" />
          <span className="font-bold text-lg">SisOS</span>
        </div>
        <p className="text-xs text-muted-foreground">Gestão de Auditorias</p>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou RI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Audit List */}
      <ScrollArea className="flex-1 px-3">
        {Object.entries(grouped).map(([month, items]) => (
          <div key={month} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-medium">
                {month}
              </Badge>
              <span className="text-xs text-muted-foreground">({items.length})</span>
            </div>
            {items.map((a) => {
              const isActive = pathname === `/auditoria/${a.id}`;
              const isVencida = a.data_vencimento && new Date(a.data_vencimento) < new Date();
              return (
                <Link
                  key={a.id}
                  href={`/auditoria/${a.id}`}
                  className={`block p-2 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate flex items-center gap-1">
                        {a.me_epp && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            ME
                          </Badge>
                        )}
                        {a.fiscalizada}
                      </p>
                      {a.ri && (
                        <p className="text-xs text-muted-foreground">RI: {a.ri}</p>
                      )}
                      {a.municipio && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          📍 {a.municipio}
                        </p>
                      )}
                    </div>
                    {isVencida && (
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </ScrollArea>

      {/* Bottom actions */}
      <div className="p-3 border-t space-y-2">
        <Link href="/nova-auditoria">
          <Button className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Auditoria
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </div>
  );
}
