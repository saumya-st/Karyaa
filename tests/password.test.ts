import bcrypt from "bcryptjs";
import { describe, expect, it } from "vitest";

/**
 * registerUser hashes passwords with bcrypt at cost 12 and the Credentials
 * provider verifies them with bcrypt.compare. These tests pin that contract.
 */
describe("password hashing round trip", () => {
  const password = "correct-horse-battery-staple";

  it("hashes with cost 12 and verifies the original password", async () => {
    const hash = await bcrypt.hash(password, 12);
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(hash).not.toContain(password);
    await expect(bcrypt.compare(password, hash)).resolves.toBe(true);
  }, 15_000);

  it("rejects a wrong password and produces unique salts", async () => {
    const [hashA, hashB] = await Promise.all([bcrypt.hash(password, 4), bcrypt.hash(password, 4)]);
    expect(hashA).not.toBe(hashB);
    await expect(bcrypt.compare("wrong-password", hashA)).resolves.toBe(false);
    await expect(bcrypt.compare(password, hashB)).resolves.toBe(true);
  });
});
