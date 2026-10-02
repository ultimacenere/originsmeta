/**
 * Test del codice dell'email nel pannello di accesso (`cleanOtp`, `otpErrorKind` in loginLabels.ts) e dei testi che lo
 * spiegano nelle tre lingue: `node --test src/lib/loginLabels.test.ts`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { cleanOtp, OTP_MAX_DIGITS, OTP_MIN_DIGITS, otpErrorKind, type LoginLabels } from "./loginLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { en } from "./dictionaries/en.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { it as itDict } from "./dictionaries/it.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { es } from "./dictionaries/es.ts";

describe("cleanOtp", () => {
  test("tiene solo le cifre del codice scritto o incollato", () => {
    assert.equal(cleanOtp("123456"), "123456");
    assert.equal(cleanOtp(" 123 456 "), "123456");
    assert.equal(cleanOtp("123-456"), "123456");
    assert.equal(cleanOtp("Il tuo codice è 482913"), "482913");
  });

  test("accetta le lunghezze che Supabase può mandare, da 6 a 10 cifre", () => {
    assert.equal(cleanOtp("1".repeat(OTP_MIN_DIGITS)), "1".repeat(OTP_MIN_DIGITS));
    assert.equal(cleanOtp("2".repeat(OTP_MAX_DIGITS)), "2".repeat(OTP_MAX_DIGITS));
    assert.equal(cleanOtp("12345"), null);
    assert.equal(cleanOtp("1".repeat(OTP_MAX_DIGITS + 1)), null);
    assert.equal(cleanOtp(""), null);
    assert.equal(cleanOtp("abcdef"), null);
  });

  test("un incollato enorme non passa intero alla regex", () => {
    assert.equal(cleanOtp("1".repeat(100_000)), null);
  });
});

describe("otpErrorKind", () => {
  test("scaduto o sbagliato è lo stesso errore per Supabase", () => {
    assert.equal(otpErrorKind({ status: 403, code: "otp_expired" }), "invalid");
    assert.equal(otpErrorKind({ status: 403 }), "invalid");
  });

  test("troppi tentativi", () => {
    assert.equal(otpErrorKind({ status: 429, code: "over_request_rate_limit" }), "tooMany");
    assert.equal(otpErrorKind({ status: 429 }), "tooMany");
  });

  test("il resto è generico", () => {
    assert.equal(otpErrorKind({ status: 500, code: "unexpected_failure" }), "generic");
    assert.equal(otpErrorKind({ status: 403, code: "signup_disabled" }), "generic");
    assert.equal(otpErrorKind(null), "generic");
  });
});

describe("testi del codice", () => {
  const codeKeys = ["codeToggle", "codeLabel", "codeHint", "codeSubmit", "codeChecking", "codeFormat", "codeNeedsEmail", "codeInvalid", "codeTooMany"] satisfies (keyof LoginLabels)[];
  for (const [lang, dict] of [["en", en], ["it", itDict], ["es", es]] as const) {
    test(`${lang}: tutti presenti e diversi dall'inglese`, () => {
      for (const key of codeKeys) {
        const text = dict.auth[key];
        assert.ok(typeof text === "string" && text.trim().length > 0, `${lang}.${key} vuoto`);
        if (lang !== "en") assert.notEqual(text, en.auth[key], `${lang}.${key} non tradotto`);
      }
    });

    test(`${lang}: il messaggio dopo l'invio parla del codice e tiene {email}`, () => {
      assert.ok(dict.auth.sentTo.includes("{email}"));
      assert.match(dict.auth.sentTo, /code|codice|código/i);
    });
  }
});
