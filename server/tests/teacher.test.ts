import { describe, expect, it } from "vitest";
import { parseAnswer } from "../src/services/teacher.js";

describe("parseAnswer (DeepSeek replies)", () => {
  it("accepts a valid board answer", () => {
    const a = parseAnswer(JSON.stringify({ title: "Moon", subject: "Science", blocks: [{ t: "p", text: "Hi" }, { t: "moon" }] }));
    expect(a.blocks).toHaveLength(2);
  });
  it("rejects broken JSON, wrong shape and empty answers", () => {
    for (const bad of ["not json", "{}", JSON.stringify({ title: "x", subject: "y", blocks: [] }), JSON.stringify({ title: "x", subject: "y", blocks: [{ t: "video" }] }), null]) {
      expect(() => parseAnswer(bad)).toThrow();
    }
  });
});
