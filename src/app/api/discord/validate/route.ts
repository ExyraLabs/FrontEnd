import { NextRequest, NextResponse } from "next/server";

// Validates whether a Discord user exists in the target guild.
// Requires the bot to be in the guild.
// Env vars:
// - DISCORD_BOT_TOKEN: A bot token with access to the guild
// - DISCORD_GUILD_ID: The guild (server) ID to validate against

const DISCORD_API = "https://discord.com/api";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      userId?: string | number;
      username?: string;
    };

    const token = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    if (!token || !guildId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Server not configured for Discord validation. Missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID.",
        },
        { status: 500 }
      );
    }

    const headers = {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    } as const;

    // Prefer validation by user ID (most reliable)
    if (body.userId) {
      const url = `${DISCORD_API}/guilds/${guildId}/members/${body.userId}`;
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.status === 200) {
        const member = await res.json();
        return NextResponse.json({ ok: true, exists: true, member });
      }
      if (res.status === 404) {
        return NextResponse.json({ ok: true, exists: false });
      }
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: `Discord API error (${res.status}): ${text}` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Provide userId or username to validate." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
