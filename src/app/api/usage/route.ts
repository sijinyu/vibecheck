import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import { getUsage, FREE_LIMITS } from "@/lib/usage-tracker";

export async function GET() {
  try {
    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json({ data: null });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

    const usage = await getUsage(supabase, user.id);

    return NextResponse.json({
      data: {
        usage,
        limits: FREE_LIMITS,
        isPro: false, // TODO: check subscription status
      },
    });
  } catch {
    return NextResponse.json(
      { error: { message: "사용량을 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}
