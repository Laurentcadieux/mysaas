import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";

function response(body: unknown, ok = true): Response {
  return {
    ok,
    json: async () => body
  } as Response;
}

function mockFetch(responseBody: unknown, ok = true, delayMs = 0) {
  const fetchMock = vi.fn((url: string) => {
    const body =
      url === "/api/admin/customers"
        ? { customers: [] }
        : url === "/api/plans"
          ? { plans: [] }
          : responseBody;
    return new Promise<Response>((resolve) => {
      setTimeout(() => {
        resolve(response(body, ok));
      }, delayMs);
    });
  });
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        response(url === "/api/plans" ? { plans: [] } : { customers: [] })
      )
    );
  });

  it("renders required capture fields", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /subscription saas/i })).toBeVisible();
    expect(screen.getByLabelText(/organization/i)).toBeRequired();
    expect(screen.getByLabelText(/owner email/i)).toBeRequired();
    expect(screen.getByLabelText(/subscription plan/i)).toBeVisible();
    expect(screen.getByLabelText(/greeting/i)).toBeRequired();
    expect(screen.getByLabelText(/first name/i)).toBeRequired();
    expect(screen.getByLabelText(/^email$/i)).toBeRequired();
    expect(screen.getByLabelText(/business challenge/i)).toBeRequired();
  });

  it("registers a customer and creates the first conversational lead agent", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/customers/register") {
        return response({
          customer: {
            organization: { id: "org-1", name: "Northstar Advisory", website: "" },
            owner: { id: "user-1", fullName: "Ava Smith", email: "ava@example.com" },
            subscription: {
              id: "sub-1",
              planCode: "lead-starter",
              status: "trialing",
              currentPeriodEnd: "2026-08-15T00:00:00.000Z"
            }
          }
        });
      }
      if (url === "/api/organizations/org-1/agents") {
        return response({
          setup: {
            project: { id: "project-1", name: "Website leads", objective: "Capture leads" },
            agent: { id: "agent-1", name: "Lead intake", type: "lead-generation", status: "draft" }
          }
        });
      }
      if (url === "/api/plans") {
        return response({
          plans: [
            {
              code: "lead-starter",
              name: "Lead Starter",
              monthlyPriceCents: 4900,
              includedAgents: 1,
              includedTeamMembers: 3,
              monthlyConversations: 500
            }
          ]
        });
      }
      return response({
        customers: [
          {
            organizationId: "org-1",
            organizationName: "Northstar Advisory",
            ownerEmail: "ava@example.com",
            planName: "Lead Starter",
            planCode: "lead-starter",
            subscriptionStatus: "trialing",
            monthlyPriceCents: 4900,
            currentPeriodEnd: "2026-08-15T00:00:00.000Z",
            agentCount: 1
          }
        ]
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/organization/i), "Northstar Advisory");
    await user.type(screen.getByLabelText(/owner name/i), "Ava Smith");
    await user.type(screen.getByLabelText(/owner email/i), "ava@example.com");
    await user.click(screen.getByRole("button", { name: /register customer/i }));

    expect(await screen.findByText(/ready for conversational lead agent setup/i)).toBeVisible();

    await user.type(screen.getByLabelText(/^project$/i), "Website leads");
    await user.type(screen.getByLabelText(/^lead agent$/i), "Lead intake");
    await user.click(screen.getByRole("button", { name: /create lead agent/i }));

    expect(await screen.findByText(/agent created: lead intake/i)).toBeVisible();
    expect(screen.getAllByText(/northstar advisory/i)[0]).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/customers/register",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("lead-starter")
      })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/organizations/org-1/agents",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("prevents invalid submissions before making a request", async () => {
    const fetchMock = vi.mocked(fetch);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /submit lead/i }));

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/leads",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("submits once and shows success", async () => {
    const fetchMock = mockFetch({ lead: { id: "lead-123", email: "ava@example.com" } });
    render(<App />);
    const user = await fillRequiredFields();

    await user.click(screen.getByRole("button", { name: /submit lead/i }));

    expect(await screen.findByText(/lead captured/i)).toBeVisible();
    expect(screen.getByText(/lead-123/i)).toBeVisible();
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

    await waitFor(
      () =>
        expect(fetchMock.mock.calls.filter(([url]) => url === "/api/leads")).toHaveLength(1)
    );
  });
});
