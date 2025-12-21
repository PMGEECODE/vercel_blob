import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const type = searchParams.get("type"); // signup | recovery | magiclink

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth_error=missing_code`);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 🔐 SERVER ONLY
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth confirm error:", error.message);

    return NextResponse.redirect(`${origin}/?auth_error=invalid_or_expired`);
  }

  /**
   * ✅ SUCCESS PATHS
   */

  // 📱 Mobile app deep link
  if (type === "signup") {
    return NextResponse.redirect("blobmanager://auth/verified");
  }

  // 🌐 Web fallback
  return NextResponse.redirect(`${origin}/?auth_success=true`);
}
