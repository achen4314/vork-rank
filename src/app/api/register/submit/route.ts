import { NextResponse } from "next/server";
import { getAdminDb, writeAuditLog } from "@/lib/supabase/admin";
import { verifyCode } from "@/lib/registration/email";
import { validateRegistrationForm } from "@/lib/registration/validate";
import type { RegistrationFormData } from "@/lib/types";

export const dynamic = "force-dynamic";
const defaultEventSlug = "capital-college-fitness-2026";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistrationFormData;

    // Validate form
    const errors = validateRegistrationForm(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, message: errors[0].message, errors },
        { status: 400 }
      );
    }

    // Verify code
    const verified = await verifyCode(body.email, body.verificationCode, "register");
    if (!verified.success) {
      return NextResponse.json(
        { success: false, message: verified.message },
        { status: 400 }
      );
    }

    const db = await getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, message: "服务暂时不可用" },
        { status: 503 }
      );
    }

    const eventSlug = body.eventSlug || defaultEventSlug;

    // Check for duplicate
    const { data: existing } = await db
      .from("registrations")
      .select("id, status")
      .eq("event_slug", eventSlug)
      .eq("email", body.email)
      .eq("project", body.project)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: false,
        message: "您已报名该项目，请勿重复报名",
        registrationId: existing.id,
      });
    }

    // Create registration
    const { data: registration, error } = await db
      .from("registrations")
      .insert({
        event_slug: eventSlug,
        name: body.name.trim(),
        gender: body.gender,
        id_card: body.idCard ?? null,
        phone: body.phone.trim(),
        email: body.email.trim(),
        birth_date: body.birthDate ?? null,
        nationality: body.nationality ?? "中国",
        organization: body.organization ?? null,
        emergency_name: body.emergencyName ?? null,
        emergency_phone: body.emergencyPhone ?? null,
        project: body.project,
        division_hint: body.divisionHint ?? null,
        team_name: body.teamName ?? null,
        teammates: body.teammates ?? null,
        health_ok: body.healthOk,
        waiver_ok: body.waiverOk,
        medical_note: body.medicalNote ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, message: "报名失败：" + error.message },
        { status: 500 }
      );
    }

    // Write audit log
    await writeAuditLog({
      eventSlug,
      tableName: "registrations",
      recordId: registration.id,
      action: "insert",
      newData: { ...body, verificationCode: undefined },
      note: `选手 ${body.name} 报名了 ${body.project}`,
    });

    return NextResponse.json({
      success: true,
      message: "报名成功！请等待管理员审核",
      registrationId: registration.id,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
