import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AuditoriaDetail } from "@/components/auditoria-detail";

export default async function AuditoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: auditoria } = await supabase
    .from("auditorias")
    .select("*, dets(*), autos(*), atualizacoes(*), pendencias(*)")
    .eq("id", id)
    .single();

  if (!auditoria) notFound();

  return <AuditoriaDetail auditoria={auditoria} />;
}
