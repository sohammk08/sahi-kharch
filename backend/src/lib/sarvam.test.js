import { test } from "node:test";
import assert from "node:assert/strict";

// Mock global fetch so the Sarvam calls can be verified without network.
function mockFetch(handler) {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => {
    globalThis.fetch = original;
  };
}

const jsonRes = (obj) => ({
  ok: true,
  status: 200,
  json: async () => obj,
  text: async () => JSON.stringify(obj),
});

const { translateText, textToSpeech, speechToText } = await import(
  "./sarvam.js"
);

test("translateText posts to /translate and returns translated_text", async () => {
  const restore = mockFetch(async (url, opts) => {
    assert.ok(url.includes("/translate"));
    assert.ok(!url.includes("/v1/"));
    const body = JSON.parse(opts.body);
    assert.equal(body.source_language_code, "hi-IN");
    assert.equal(body.target_language_code, "en-IN");
    return jsonRes({ translated_text: "Is this claim allowed?" });
  });
  try {
    const out = await translateText("क्या यह दावा मान्य है?", {
      sourceLanguageCode: "hi-IN",
      targetLanguageCode: "en-IN",
    });
    assert.equal(out, "Is this claim allowed?");
  } finally {
    restore();
  }
});

test("textToSpeech posts to /text-to-speech and returns base64 audio", async () => {
  const restore = mockFetch(async (url, opts) => {
    assert.ok(url.includes("/text-to-speech"));
    assert.ok(!url.includes("/v1/"));
    const body = JSON.parse(opts.body);
    assert.equal(body.language_code, "hi-IN");
    assert.equal(body.text, "Approved");
    return jsonRes({ audios: ["BASE64AUDIO"] });
  });
  try {
    const out = await textToSpeech("Approved", {
      targetLanguageCode: "hi-IN",
    });
    assert.equal(out, "BASE64AUDIO");
  } finally {
    restore();
  }
});

test("speechToText posts multipart to /speech-to-text and returns transcript", async () => {
  const restore = mockFetch(async (url, opts) => {
    assert.ok(url.includes("/speech-to-text"));
    assert.ok(!url.includes("/v1/"));
    assert.ok(opts.body instanceof FormData);
    assert.equal(opts.body.get("language_code"), "hi-IN");
    return jsonRes({ transcript: "मेरा दावा मान्य है" });
  });
  try {
    const out = await speechToText(Buffer.from("audio"), {
      languageCode: "hi-IN",
    });
    assert.equal(out, "मेरा दावा मान्य है");
  } finally {
    restore();
  }
});
