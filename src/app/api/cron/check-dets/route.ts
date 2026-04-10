import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Vercel envia automaticamente Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Cliente admin do Supabase (ignora RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Data de ontem (dia do vencimento que queremos checar)
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().split("T")[0]; // YYYY-MM-DD

  // Busca DETs cujo data_entrega foi ontem
  const { data: dets, error } = await supabaseAdmin
    .from("dets")
    .select("id, codigo, data_entrega, auditorias(fiscalizada, user_id)")
    .eq("data_entrega", ontemStr);

  if (error) {
    console.error("Erro ao buscar DETs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!dets || dets.length === 0) {
    return NextResponse.json({ message: "Nenhum DET vencido ontem.", processed: 0 });
  }

  const results: { det: string; email?: string; status: string; erro?: string }[] = [];

  for (const det of dets) {
    try {
      const auditoria = det.auditorias as unknown as { fiscalizada: string; user_id: string } | null;
      if (!auditoria) continue;

      // Busca e-mail do usuário pelo user_id
      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(auditoria.user_id);

      if (userError || !userData?.user?.email) {
        results.push({ det: det.codigo, status: "erro", erro: "usuário não encontrado" });
        continue;
      }

      const userEmail = userData.user.email;
      const fiscalizada = auditoria.fiscalizada;

      // Formata data para PT-BR (DD/MM/AAAA)
      const dataFormatada = det.data_entrega
        ? new Date(det.data_entrega + "T00:00:00").toLocaleDateString("pt-BR")
        : "—";

      // Envia e-mail via Resend
      const { error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "SisOS <onboarding@resend.dev>",
        to: userEmail,
        subject: `Prazo do DET expirado - ${fiscalizada}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <div style="background: #1a237e; padding: 16px 24px; border-radius: 8px 8px 0 0;">
              <h2 style="color: white; margin: 0; font-size: 18px;">📋 SisOS — Alerta de DET</h2>
            </div>
            <div style="background: #fff8e1; border: 1px solid #ffd54f; padding: 24px; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 16px; color: #333;">Caro AFT,</p>
              <p style="margin: 0 0 16px; color: #333;">
                O prazo da notificação via DET <strong>${det.codigo}</strong> para a fiscalizada
                <strong>${fiscalizada}</strong> venceu em <strong>${dataFormatada}</strong>.
              </p>
              <p style="margin: 24px 0 0; color: #666; font-size: 14px;">Atenciosamente,<br><strong>SisOS</strong></p>
            </div>
          </div>
        `,
        text: `Caro AFT,\n\nO prazo da notificação via DET ${det.codigo} para a fiscalizada ${fiscalizada} venceu em ${dataFormatada}.\n\nAtenciosamente,\n\nSisOS`,
      });

      if (emailError) {
        results.push({ det: det.codigo, email: userEmail, status: "erro", erro: emailError.message });
      } else {
        results.push({ det: det.codigo, email: userEmail, status: "enviado" });
      }
    } catch (err) {
      results.push({ det: det.codigo, status: "erro", erro: String(err) });
    }
  }

  return NextResponse.json({
    data: ontemStr,
    processed: results.length,
    results,
  });
}
