import { NextRequest, NextResponse } from "next/server";

// Validates whether a Telegram user is a member of a target chat/group via Bot API.
// Env vars:
// - TELEGRAM_BOT_TOKEN
// - TELEGRAM_CHAT_ID (group/channel id, e.g. -1001234567890)

export async function POST(req: NextRequest) {
  try {
    const { userId, username } = (await req.json()) as {
      userId?: number | string;
      username?: string;
    };

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Server not configured for Telegram validation. Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID.",
        },
        { status: 500 }
      );
    }

    // Prefer user ID if available
    const target = userId
      ? userId
      : username && username.trim().length > 0
      ? username.trim().startsWith("@")
        ? username.trim()
        : `@${username.trim()}`
      : undefined;

    if (!target) {
      return NextResponse.json(
        { ok: false, error: "Provide userId or username to validate." },
        { status: 400 }
      );
    }

    // Telegram Bot API getChatMember
    // https://api.telegram.org/bot<token>/getChatMember?chat_id=<chat_id>&user_id=<user_id>
    // If using username, Telegram API expects user_id to be numeric; usernames generally cannot be used here.
    // So we attempt resolve by username via getChat? Not available. Hence: validation by username alone is unreliable.
    // We'll only support userId; if only username is provided, we fail gracefully.

    if (typeof target !== "number" && !/^-?\d+$/.test(String(target))) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Telegram validation requires a numeric userId; username-only checks are not supported by Bot API.",
        },
        { status: 400 }
      );
    }

    const url = `https://api.telegram.org/bot${token}/getChatMember?chat_id=${encodeURIComponent(
      chatId
    )}&user_id=${encodeURIComponent(String(target))}`;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (!res.ok || !data?.ok) {
      const msg =
        data?.description ||
        `Telegram API error (${res.status}): ${res.statusText}`;
      return NextResponse.json({ ok: false, error: msg }, { status: 502 });
    }

    // data.result.status can be: creator, administrator, member, restricted, left, kicked
    const status = data.result?.status as string | undefined;
    const isMember =
      status === "creator" || status === "administrator" || status === "member";

    return NextResponse.json({
      ok: true,
      exists: isMember,
      member: data.result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
