import { describe, expect, it } from "vitest";
import { getApiBaseUrl, resolveApiBaseUrl } from "./api.js";

describe("api client", () => {
  it("defaults to same-origin api calls", () => {
    expect(getApiBaseUrl()).toBe("");
  });

  it("allows api base overrides only in development", () => {
    const privateBackendProbe = `http://${["10", "60", "0", "20"].join(".")}:4000`;

    expect(
      resolveApiBaseUrl({
        DEV: true,
        VITE_API_BASE_URL: "http://127.0.0.1:4000/"
      })
    ).toBe("http://127.0.0.1:4000");

    expect(
      resolveApiBaseUrl({
        DEV: false,
        VITE_API_BASE_URL: privateBackendProbe
      })
    ).toBe("");
  });
});
