import { NextResponse } from "next/server";
import { sendVerificationCode, verifyCode } from "@/lib/registration/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, purpose } = body as { email?: string; purpose?: string };

    if (!email || !purpose) {
      return NextResponse.json(
        { success: false, message: "邮箱和用途不能为空" },
        { status: 400 }
      );
    }

    if (!["register", "status_check"].includes(purpose)) {
      return NextResponse.json(
        { success: false, message: "无效的验证用途" },
        { status: 400 }
      );
    }

    const result = await sendVerificationCode(email, purpose);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json(
      { success: false, message: "服务器错误" },
      { status: 500 }
    );
  }
}
