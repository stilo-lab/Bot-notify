import { createHash } from "node:crypto";

const pollIntervalMs = 20_000;
const requestTimeoutMs = 12_000;

class HttpError extends Error {
  constructor(service, response) {
    super(`${service}: HTTP ${response.status}`);
    this.status = response.status;
    const retrySeconds = Number(response.headers.get("Retry-After"));
    this.retryAfterMs = Number.isFinite(retrySeconds) ? Math.max(0, retrySeconds * 1000) : 0;
  }
}

async function requestJson(service, url, options, signal) {
  const response = await fetch(url, {
    ...options,
    redirect: "error",
    signal: AbortSignal.any([signal, AbortSignal.timeout(requestTimeoutMs)]),
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpError(service, response);
  }
  return response.json();
}

function formatUsername(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[\p{Cc}\p{Cf}]/gu, " ").trim().slice(0, 80)
    .replace(/[\\`*_{}\[\]()<>#+!|~]/g, "\\$&");
}

export async function deliverAlerts(config, channelId) {
  const { studioUrl, discordUrl, studioToken, discordToken, channelIds, signal } = config;
  const endpoint = studioUrl + "/api/discord-alerts";
  const studioHeaders = { Authorization: "Bearer " + studioToken };
  const queue = new URL(endpoint);
  queue.searchParams.set("channelId", channelId);
  const { alerts } = await requestJson("Stilo Bot Studio", queue.href, { headers: studioHeaders }, signal);
  if (!Array.isArray(alerts)) throw new Error("Stilo Bot Studio: Ungültige Antwort.");

  for (const alert of alerts) {
    if (
      typeof alert?.id !== "string" ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(alert.id) ||
      typeof alert.number !== "string" ||
      !/^ST-[0-9A-F]{8}$/.test(alert.number)
    ) throw new Error("Stilo Bot Studio: Ungültige Anfragenummer.");

    const username = formatUsername(alert.username);
    const content = [
      `🔔 **Neue Bot-Anfrage** · ${alert.number}`,
      username && `**Username** ${username}`,
      `<${studioUrl}/anfragen>`,
    ].filter(Boolean).join("\n");
    const nonce = createHash("sha256").update(`${alert.id}:${channelId}`).digest("hex").slice(0, 25);

    await requestJson("Discord", discordUrl + "/channels/" + channelId + "/messages", {
      method: "POST",
      headers: { Authorization: "Bot " + discordToken, "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        allowed_mentions: { parse: [] },
        nonce,
        enforce_nonce: true,
        flags: 4,
      }),
    }, signal);

    await requestJson("Stilo Bot Studio", endpoint, {
      method: "POST",
      headers: { ...studioHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ id: alert.id, channelId, channelIds }),
    }, signal);
    console.log("Discord-Meldung gesendet:", alert.number, "Kanal", channelId);
  }
}

export async function runNotifier(config) {
  while (!config.signal.aborted) {
    let waitMs = pollIntervalMs;
    for (const channelId of config.channelIds) {
      if (config.signal.aborted) return;
      try {
        await deliverAlerts(config, channelId);
      } catch (error) {
        if (config.signal.aborted) return;
        const message = error instanceof HttpError || error?.message?.startsWith("Stilo Bot Studio:")
          ? error.message
          : "Verbindungsfehler";
        console.error("Abfrage wird wiederholt:", message, "Kanal", channelId);
        if (error instanceof HttpError) {
          waitMs = Math.max(waitMs, error.retryAfterMs);
          if (error.status === 429) break;
        }
      }
    }
    try {
      await config.delay(waitMs, undefined, { signal: config.signal });
    } catch (error) {
      if (!config.signal.aborted) throw error;
    }
  }
}
