import { randomBytes } from "node:crypto";
import { hashPin } from "./session";
import { newId } from "./store";
import type { Profile } from "./types";

export const SAMPLE_NAME = "Priya Sharma";

/** The sample portraits and morph served from /public/demo. Generated vector art; no real person. */
export const SAMPLE_FILES = { portraits: ["/demo/priya-1.png", "/demo/priya-2.png"], morph: "/demo/sample-morph.png" } as const;

/** A throwaway shield for the guided demo: a normal profile with a random PIN nobody is told. */
export function buildSampleProfile(): Profile {
  const salt = randomBytes(8).toString("hex");
  const pin = String(100000 + Math.floor(Math.random() * 900000));
  return {
    id: newId(),
    name: SAMPLE_NAME,
    salt,
    pinHash: hashPin(pin, salt),
    createdAt: new Date().toISOString(),
    vault: [],
    sample: true,
  };
}
