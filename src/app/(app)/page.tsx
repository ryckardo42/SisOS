import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: emAndamento } = await supabase
    .from("auditorias")
    .select("*, dets(*), pendencias(*), atualizacoes(*)")
    .eq("status", "em_andamento")
    .order("data_inicio", { ascending: true });

  const { count: finalizadasCount } = await supabase
    .from("auditorias")
    .select("*", { count: "exact", head: true })
    .eq("status", "finalizada");

  return (
    <DashboardContent
      userName={user?.email?.split("@")[0] || "Auditor"}
      auditorias={emAndamento || []}
      finalizadasCount={finalizadasCount || 0}
    />
  );
}
