import { NextResponse } from "next/server";
import { verifyCode } from "@/lib/registration/email";
import { queryRegistrationByEmail } from "@/lib/registration/data";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, purpose, eventSlug } = body as {
      email?: string;
      code?: string;
      purpose?: string;
      eventSlug?: string;
    };

    if (!email || !code || !purpose) {
      return NextResponse.json(
        { success: false, message: "缺少必填参数" },
        { status: 400 }
      );
    }

    // Verify the code
    const result = await verifyCode(email, code, purpose);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // If status check, also return registrations
    if (purpose === "status_check" && eventSlug) {
      const registrations = await queryRegistrationByEmail(eventSlug, email);
      return NextResponse.json({
        success: true,
        message: "验证成功",
        registrations,
      });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
