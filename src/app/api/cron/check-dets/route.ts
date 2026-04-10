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

  // Usa anon key — a função SQL tem SECURITY DEFINER para acessar auth.users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const resend = new Resend(process.env.RESEND_API_KEY);

  // Data de ontem
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const ontemStr = ontem.toISOString().split("T")[0]; // YYYY-MM-DD

  // Chama a função SQL que retorna DETs vencidos com e-mail do usuário
  const { data: dets, error } = await supabase.rpc("get_dets_vencidos", {
    target_date: ontemStr,
  });

  if (error) {
    console.error("Erro ao buscar DETs:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!dets || dets.length === 0) {
    return NextResponse.json({ message: "Nenhum DET venceu ontem.", processed: 0 });
  }

  const results: { det: string; email?: string; status: string; erro?: string }[] = [];

  for (const det of dets as {
    det_id: string;
    codigo: string;
    data_entrega: string;
    fiscalizada: string;
    user_email: string;
  }[]) {
    try {
      // Formata data para PT-BR (DD/MM/AAAA)
      const dataFormatada = det.data_entrega
        ? new Date(det.data_entrega + "T00:00:00").toLocaleDateString("pt-BR")
        : "—";

      const { error: emailError } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "SisOS <onboarding@resend.dev>",
        to: det.user_email,
        subject: `Prazo do DET expirado - ${det.fiscalizada}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;">
            <div style="background:#1a237e;padding:18px 24px;border-radius:8px 8px 0 0;">
              <h2 style="color:white;margin:0;font-size:17px;">📋 SisOS — Alerta de DET Vencido</h2>
            </div>
            <div style="background:#fff8e1;border:1px solid #ffd54f;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
              <p style="margin:0 0 14px;color:#333;font-size:15px;">Caro AFT,</p>
              <p style="margin:0 0 14px;color:#333;font-size:15px;">
                O prazo da notificação via DET <strong>${det.codigo}</strong> para a fiscalizada
                <strong>${det.fiscalizada}</strong> venceu em <strong>${dataFormatada}</strong>.
              </p>
              <hr style="border:none;border-top:1px solid #ffe082;margin:20px 0;"/>
              <p style="margin:0;color:#888;font-size:13px;">
                Atenciosamente,<br/>
                <strong style="color:#1a237e;">SisOS</strong> — Sistema de Gestão de Auditorias
              </p>
            </div>
          </div>
        `,
        text:
          `Caro AFT,\n\n` +
          `O prazo da notificação via DET ${det.codigo} para a fiscalizada ${det.fiscalizada} venceu em ${dataFormatada}.\n\n` +
          `Atenciosamente,\n\nSisOS`,
      });

      if (emailError) {
        results.push({ det: det.codigo, email: det.user_email, status: "erro", erro: emailError.message });
      } else {
        results.push({ det: det.codigo, email: det.user_email, status: "enviado" });
      }
    } catch (err) {
      results.push({ det: det.codigo, status: "erro", erro: String(err) });
    }
  }

  return NextResponse.json({
    data_verificada: ontemStr,
    processed: results.length,
    results,
  });
}
