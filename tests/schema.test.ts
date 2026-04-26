import { describe, expect, it } from "vitest";

import { demoBrief } from "@/tests/fixtures";
import { nicheBriefSchema } from "@/types/brief";

describe("NicheBrief schema", () => {
  it("accepts a valid complete brief", () => {
    const parsed = nicheBriefSchema.safeParse(demoBrief);
    expect(parsed.success).toBe(true);
  });

  it("fails when a required section is missing", () => {
    const invalid = {
      ...demoBrief,
      sections: {
        ...demoBrief.sections,
      },
    };

    delete (invalid.sections as Partial<typeof invalid.sections>).motherInsight;

    const parsed = nicheBriefSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("fails when BuildSignal verdict is invalid", () => {
    const invalid = {
      ...demoBrief,
      sections: {
        ...demoBrief.sections,
        buildSignal: {
          ...demoBrief.sections.buildSignal,
          verdict: "Blue",
        },
      },
    };

    const parsed = nicheBriefSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });
});
