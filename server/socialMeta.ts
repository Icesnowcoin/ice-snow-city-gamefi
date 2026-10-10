import type { Request } from "express";

const GAME_TITLE = "Ice Snow City｜Build the Commercial Empire";
const GAME_DESCRIPTION = "Enter Ice Snow City, build a frozen commercial empire, manage your city and prepare for the next chapter of the urban simulation.";
const GAME_IMAGE_PATH = "/manus-storage/isc_opening_hero_recomposed_v2_48a42ac8.webp";

function getRequestOrigin(request: Request): string {
  const forwardedProtocol = request.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(forwardedProtocol) ? forwardedProtocol[0] : forwardedProtocol?.split(",")[0]) || request.protocol || "https";
  const host = request.get("host");
  return host ? `${protocol}://${host}` : "";
}

export function renderGameSocialMeta(request: Request): string {
  const pathname = new URL(request.originalUrl || request.path, "http://localhost").pathname.replace(/\/$/, "") || "/";
  if (pathname !== "/game") return "";

  const origin = getRequestOrigin(request);
  const gameUrl = `${origin}/game`;
  const imageUrl = `${origin}${GAME_IMAGE_PATH}`;
  const escapeAttribute = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

  return [
    `<meta name="description" content="${escapeAttribute(GAME_DESCRIPTION)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Ice Snow City" />`,
    `<meta property="og:title" content="${escapeAttribute(GAME_TITLE)}" />`,
    `<meta property="og:description" content="${escapeAttribute(GAME_DESCRIPTION)}" />`,
    `<meta property="og:url" content="${escapeAttribute(gameUrl)}" />`,
    `<meta property="og:image" content="${escapeAttribute(imageUrl)}" />`,
    `<meta property="og:image:alt" content="Ice Snow City frozen commercial empire game preview" />`,
    `<meta property="og:image:type" content="image/webp" />`,
    `<meta property="og:image:width" content="1280" />`,
    `<meta property="og:image:height" content="720" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttribute(GAME_TITLE)}" />`,
    `<meta name="twitter:description" content="${escapeAttribute(GAME_DESCRIPTION)}" />`,
    `<meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />`,
    `<meta name="twitter:image:alt" content="Ice Snow City frozen commercial empire game preview" />`,
  ].join("\n    ");
}

export const GAME_SOCIAL_META = { title: GAME_TITLE, description: GAME_DESCRIPTION, imagePath: GAME_IMAGE_PATH } as const;
