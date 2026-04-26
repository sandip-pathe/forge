import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { kvMock } = vi.hoisted(() => ({
  kvMock: {
    set: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock("@vercel/kv", () => ({
  createClient: () => kvMock,
  kv: kvMock,
}));

vi.mock("nanoid", () => ({
  nanoid: () => "brief123abc",
}));

import { GET } from "@/app/api/brief/[id]/route";
import { POST } from "@/app/api/brief/save/route";
import { demoBrief } from "@/tests/fixtures";

describe("brief save/fetch routes", () => {
  beforeEach(() => {
    kvMock.set.mockReset();
    kvMock.get.mockReset();
    process.env.KV_REST_API_URL = "https://example.com";
    process.env.KV_REST_API_TOKEN = "token";
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
  });

  it("save generates id and stores brief", async () => {
    const response = await POST(
      new Request("http://localhost/api/brief/save", {
        method: "POST",
        body: JSON.stringify({ ...demoBrief, id: undefined }),
      }),
    );

    const json = (await response.json()) as { status: string; id: string };

    expect(response.status).toBe(200);
    expect(json.status).toBe("success");
    expect(json.id).toBe("brief123abc");
    expect(kvMock.set).toHaveBeenCalledWith(
      "brief:brief123abc",
      expect.objectContaining({ id: "brief123abc" }),
    );
  });

  it("fetch returns stored brief by id", async () => {
    kvMock.get.mockResolvedValueOnce({ ...demoBrief, id: "brief123abc" });

    const response = await GET(
      new Request("http://localhost/api/brief/brief123abc"),
      {
        params: Promise.resolve({ id: "brief123abc" }),
      },
    );

    const json = (await response.json()) as {
      status: string;
      brief?: { id: string };
    };

    expect(response.status).toBe(200);
    expect(json.status).toBe("success");
    expect(json.brief?.id).toBe("brief123abc");
  });

  it("fetch returns 404 for missing id", async () => {
    kvMock.get.mockResolvedValueOnce(null);

    const response = await GET(
      new Request("http://localhost/api/brief/missing"),
      {
        params: Promise.resolve({ id: "missing" }),
      },
    );

    const json = (await response.json()) as { status: string };

    expect(response.status).toBe(404);
    expect(json.status).toBe("failed");
  });
});
