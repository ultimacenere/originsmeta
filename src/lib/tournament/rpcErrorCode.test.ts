import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { rpcErrorCode } from "./rpcErrorCode.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { STAGE_RPC_ERRORS } from "./stageLabels.ts";
// @ts-expect-error TS5097: Node richiede l'estensione .ts nell'import
import { FORMAT_RPC_ERRORS } from "./formatLabels.ts";

const actionsSrc = readFileSync(new URL("./actions.ts", import.meta.url), "utf8");
const listed = [...(actionsSrc.match(/const RPC_ERRORS = \[([\s\S]*?)\];/)?.[1] ?? "").matchAll(/"([a-z_]+)"/g)].map((m) => m[1]);
const codes: string[] = [...listed, ...STAGE_RPC_ERRORS, ...FORMAT_RPC_ERRORS];

test("l'elenco dei codici di actions.ts si legge", () => {
  assert.ok(listed.length > 30, String(listed.length));
  assert.ok(listed.includes("user_not_found") && listed.includes("not_found"));
});

test("ogni codice delle RPC dei tornei torna se stesso, anche quando ne contiene un altro", () => {
  for (const k of codes) assert.equal(rpcErrorCode(k, codes), k, k);
  // il messaggio di Supabase può avere testo intorno
  assert.equal(rpcErrorCode("ERROR: user_not_found", codes), "user_not_found");
  assert.equal(rpcErrorCode("checkin_not_open", codes), "checkin_not_open");
  assert.equal(rpcErrorCode("bad_side_swap", codes), "bad_side_swap");
});

test("nessun codice: null (l'azione lo mostra come errore del database)", () => {
  assert.equal(rpcErrorCode("connection reset", codes), null);
  assert.equal(rpcErrorCode("", codes), null);
});

test("actions.ts usa rpcErrorCode", () => {
  assert.ok(actionsSrc.includes("rpcErrorCode(m, RPC_ERRORS)"));
});
