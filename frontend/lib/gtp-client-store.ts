import { GtpClient } from "./gpt-client";

const gtpClientStore: {
  [key: string]: GtpClient;
} = {};

export function getOrCreateGtpClient(gameId: string): GtpClient {
  if (!gtpClientStore[gameId]) {
    console.log(`Creating new GTP client for game ID: ${gameId}`);
    gtpClientStore[gameId] = new GtpClient(
      process.env.KATAGO_PATH || "katago",
      process.env.KATAGO_MODEL || "/models/gtp_model.bin",
      process.env.KATAGO_CONFIG || "/models/analysis_example.cfg"
    );
  } else {
    console.log(`Reusing existing GTP client for game ID: ${gameId}`);
  }
  return gtpClientStore[gameId];
}