import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";

function mockFetch(response: unknown, ok = true, delayMs = 0) {
  const fetchMock = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        setTimeout(() => {
          resolve({
            ok,
            json: async () => response
          } as Response);
        }, delayMs);
      })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillRequiredFields() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/first name/i), "Ava");
  await user.type(screen.getByLabelText(/^email$/i), "ava@example.com");
  await user.type(screen.getByLabelText(/business challenge/i), "Need more qualified leads");
  await user.click(screen.getByLabelText(/consent/i));
  return user;
}

describe("App", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders required capture fields", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /build the first adviceconnect/i })).toBeVisible();
    expect(screen.getByLabelText(/organization/i)).toBeRequired();
    expect(screen.getByLabelText(/owner email/i)).toBeRequired();
    expect(screen.getByLabelText(/first name/i)).toBeRequired();
    expect(screen.getByLabelText(/^email$/i)).toBeRequired();
    expect(screen.getByLabelText(/business challenge/i)).toBeRequired();
  });

  it("creates a workspace foundation", async () => {
    const fetchMock = mockFetch({
      workspace: {
        organization: { id: "org-1", name: "Northstar Advisory", website: "" },
        owner: { id: "user-1", fullName: "Ava Smith", email: "ava@example.com" },
        subscription: {
          id: "sub-1",
          planCode: "lead-starter",
          status: "trialing",
          currentPeriodEnd: "2026-08-15T00:00:00.000Z"
        },
        project: { id: "project-1", name: "Website leads", objective: "Capture leads" },
        agent: { id: "agent-1", name: "Lead intake", type: "lead-generation", status: "draft" }
      }
    });
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/organization/i), "Northstar Advisory");
    await user.type(screen.getByLabelText(/owner name/i), "Ava Smith");
    await user.type(screen.getByLabelText(/owner email/i), "ava@example.com");
    await user.type(screen.getByLabelText(/^project$/i), "Website leads");
    await user.type(screen.getByLabelText(/lead agent/i), "Lead intake");
    await user.type(screen.getByLabelText(/agent objective/i), "Capture leads");
    await user.click(screen.getByRole("button", { name: /create workspace/i }));

    expect(await screen.findByText(/northstar advisory/i)).toBeVisible();
    expect(screen.getByText(/plan: lead-starter/i)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/foundation/workspaces",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("prevents invalid submissions before making a request", async () => {
    const fetchMock = mockFetch({});
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /submit lead/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits once and shows success", async () => {
    const fetchMock = mockFetch({ lead: { id: "lead-123", email: "ava@example.com" } });
    render(<App />);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: /submit lead/i }));

    expect(await screen.findByText(/lead captured/i)).toBeVisible();
    expect(screen.getByText(/lead-123/i)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/leads",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("renders backend failure", async () => {
    mockFetch(
      { error: { message: "Lead submission is invalid.", fields: { email: "Email is required." } } },
      false
    );
    render(<App />);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: /submit lead/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Lead submission is invalid.");
  });

  it("suppresses duplicate concurrent clicks", async () => {
    const fetchMock = mockFetch({ lead: { id: "lead-456", email: "ava@example.com" } }, true, 50);
    render(<App />);
    const user = await fillRequiredFields();
    const button = screen.getByRole("button", { name: /submit lead/i });

    await user.dblClick(button);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
