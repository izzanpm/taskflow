import { randomBytes } from "node:crypto";

export const INVITE_EXPIRY_DAYS = 7;

export function createInviteToken() {
  return randomBytes(32).toString("hex");
}

export function getInviteExpiry() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + INVITE_EXPIRY_DAYS);
  return expiry;
}

export function isInviteExpired(expiresAt: Date) {
  return expiresAt.getTime() <= Date.now();
}
