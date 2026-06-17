import crypto from "crypto";

export function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

export function verifyOtp(otp, hash) {
  return hashOtp(otp) === hash;
}

export function generateVerificationToken() {
  return crypto.randomUUID();
}
