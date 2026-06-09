import { NextResponse } from "next/server";
import { queryRegistrationByEmail } from "@/lib/registration/data";

export const dynamic = "force-dynamic";
const defaultEventSlug = "capital-college-fitness-2026";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const eventSlug = searchParams.get("event") || defaultEventSlug;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "请提供邮箱地址" },
        { status: 400 }
      );
    }

    const registrations = await queryRegistrationByEmail(eventSlug, email);

    if (registrations.length === 0) {
      return NextResponse.json({
        success: false,
        message: "未找到该邮箱的报名记录",
        registrations: [],
      });
    }

    return NextResponse.json({
      success: true,
      registrations,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
