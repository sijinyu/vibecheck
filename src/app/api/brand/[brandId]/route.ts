import { NextResponse } from "next/server";
import { tryCreateClient } from "@/lib/supabase/server";
import {
  getBrandProfileById,
  updateBrandProfile,
  deleteBrandProfile,
} from "@/lib/supabase/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "Service unavailable" } },
        { status: 503 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

    const brand = await getBrandProfileById(supabase, brandId);
    if (!brand || brand.user_id !== user.id) {
      return NextResponse.json(
        { error: { message: "브랜드를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: brand });
  } catch {
    return NextResponse.json(
      { error: { message: "브랜드 정보를 불러올 수 없습니다" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "Service unavailable" } },
        { status: 503 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

    // Verify ownership
    const existing = await getBrandProfileById(supabase, brandId);
    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: { message: "브랜드를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, handle, preferredTiers, targetCategories } = body;

    const updated = await updateBrandProfile(supabase, brandId, {
      ...(name ? { name } : {}),
      ...(handle !== undefined ? { handle } : {}),
      ...(preferredTiers ? { preferred_tiers: preferredTiers } : {}),
      ...(targetCategories ? { target_categories: targetCategories } : {}),
    });

    if (!updated) {
      return NextResponse.json(
        { error: { message: "브랜드 업데이트에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json(
      { error: { message: "브랜드 업데이트에 실패했습니다" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const supabase = await tryCreateClient();
    if (!supabase) {
      return NextResponse.json(
        { error: { message: "Service unavailable" } },
        { status: 503 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: { message: "로그인이 필요합니다" } },
        { status: 401 }
      );
    }

    // Verify ownership
    const existing = await getBrandProfileById(supabase, brandId);
    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json(
        { error: { message: "브랜드를 찾을 수 없습니다" } },
        { status: 404 }
      );
    }

    const success = await deleteBrandProfile(supabase, brandId);
    if (!success) {
      return NextResponse.json(
        { error: { message: "브랜드 삭제에 실패했습니다" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json(
      { error: { message: "브랜드 삭제에 실패했습니다" } },
      { status: 500 }
    );
  }
}
