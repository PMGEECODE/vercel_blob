import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type"); // "signup", "recovery", "magiclink", etc.
  const next = searchParams.get("next") ?? "/"; // Optional: redirect to a specific path after verification

  // Basic validation
  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_params`);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-only key — keep secret!
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    type: type as
      | "signup"
      | "recovery"
      | "magiclink"
      | "email"
      | "invite"
      | "email_change",
  });

  if (error) {
    console.error("Auth verify error:", error.message);
    return NextResponse.redirect(`${origin}/?auth_error=invalid_or_expired`);
  }

  // ✅ SUCCESS PATHS

  // For mobile app deep link after signup confirmation
  if (type === "signup") {
    return NextResponse.redirect("blobmanager://auth/verified");
  }

  // Fallback for web or other types (recovery, magic link, etc.)
  return NextResponse.redirect(`${origin}${next}?auth_success=true`);
}
