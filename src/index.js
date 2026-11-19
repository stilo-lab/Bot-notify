import { setTimeout as delay } from "node:timers/promises";
import { runNotifier } from "./notifier.js";

const discordToken = process.env.DISCORD_BOT_TOKEN?.trim();
const channelSetting = process.env.DISCORD_CHANNEL_IDS?.trim() || process.env.DISCORD_CHANNEL_ID?.trim() || "";
const channelIds = [...new Set(channelSetting.split(",").map((id) => id.trim()).filter(Boolean))];
const studioToken = process.env.STILO_ALERT_TOKEN?.trim();

const missing = [
  !discordToken && "DISCORD_BOT_TOKEN",
  channelIds.length === 0 && "DISCORD_CHANNEL_ID oder DISCORD_CHANNEL_IDS",
  !studioToken && "STILO_ALERT_TOKEN",
].filter(Boolean);

if (missing.length > 0) {
  console.error("Fehlende Railway-Variablen:", missing.join(", "));
  process.exit(1);
}
if (channelIds.length > 25 || channelIds.some((id) => !/^\d{17,22}$/.test(id))) {
  console.error("Gib bis zu 25 numerische Discord-Kanal-IDs ein. Trenne mehrere IDs mit Kommas.");
  process.exit(1);
}
if (!/^[a-f0-9]{64}$/.test(studioToken)) {
  console.error("STILO_ALERT_TOKEN muss der Schlüssel aus dem Stilo-Posteingang sein.");
  process.exit(1);
}

const controller = new AbortController();
process.once("SIGINT", () => controller.abort());
process.once("SIGTERM", () => controller.abort());
console.log("Stilo-Anfragebot gestartet. Neue Anfragen werden alle 20 Sekunden abgefragt.");

await runNotifier({
  studioUrl: "https://stilo-bot-studio.aliveopal5.chatgpt.site",
  discordUrl: "https://discord.com/api/v10",
  discordToken,
  channelIds,
  studioToken,
  signal: controller.signal,
  delay,
});
