import { useState } from "react";
import { submitLead, type LeadSubmission } from "./api.js";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; leadId: string }
  | { status: "error"; message: string };

const initialLead: LeadSubmission = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  serviceInterest: "",
  businessChallenge: "",
  budget: "",
  timeline: "",
  preferredContactMethod: "email",
  consentToFollowUp: false,
  source: "website-form"
};

export function App() {
  const [lead, setLead] = useState<LeadSubmission>(initialLead);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  const isSubmitting = state.status === "submitting";

  function updateLead<K extends keyof LeadSubmission>(field: K, value: LeadSubmission[K]) {
    setLead((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    if (!lead.firstName.trim() || !lead.email.trim() || !lead.businessChallenge.trim()) {
      setState({ status: "error", message: "Name, email, and business challenge are required." });
      return;
    }

    if (!lead.consentToFollowUp) {
      setState({ status: "error", message: "Consent is required before we can follow up." });
      return;
    }

    setState({ status: "submitting" });
    try {
      const response = await submitLead(lead);
      setState({ status: "success", leadId: response.lead.id });
      setLead(initialLead);
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not submit the lead right now. Please try again."
      });
    }
  }

  return (
    <main className="app-shell">
      <section className="product-panel" aria-labelledby="page-title">
        <p className="eyebrow">AdviceConnect MVP</p>
        <h1 id="page-title">Turn website conversations into qualified leads.</h1>
        <p className="lede">
          Capture a prospect's needs, consent, contact details, and next-step context in one
          structured intake flow.
        </p>
      </section>

      <form className="lead-form" onSubmit={handleSubmit} aria-label="Lead capture form">
        <div className="form-grid">
          <label>
            First name
            <input
              required
              value={lead.firstName}
              onChange={(event) => updateLead("firstName", event.target.value)}
              autoComplete="given-name"
            />
          </label>
          <label>
            Last name
            <input
              value={lead.lastName}
              onChange={(event) => updateLead("lastName", event.target.value)}
              autoComplete="family-name"
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={lead.email}
              onChange={(event) => updateLead("email", event.target.value)}
              autoComplete="email"
            />
          </label>
          <label>
            Phone
            <input
              value={lead.phone}
              onChange={(event) => updateLead("phone", event.target.value)}
              autoComplete="tel"
            />
          </label>
          <label>
            Company
            <input
              value={lead.company}
              onChange={(event) => updateLead("company", event.target.value)}
              autoComplete="organization"
            />
          </label>
          <label>
            Service interest
            <input
              value={lead.serviceInterest}
              onChange={(event) => updateLead("serviceInterest", event.target.value)}
            />
          </label>
          <label>
            Budget
            <input value={lead.budget} onChange={(event) => updateLead("budget", event.target.value)} />
          </label>
          <label>
            Timeline
            <input
              value={lead.timeline}
              onChange={(event) => updateLead("timeline", event.target.value)}
            />
          </label>
        </div>

        <label>
          Preferred contact
          <select
            value={lead.preferredContactMethod}
            onChange={(event) =>
              updateLead(
                "preferredContactMethod",
                event.target.value as LeadSubmission["preferredContactMethod"]
              )
            }
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="either">Either</option>
          </select>
        </label>

        <label>
          Business challenge
          <textarea
            required
            rows={5}
            value={lead.businessChallenge}
            onChange={(event) => updateLead("businessChallenge", event.target.value)}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={lead.consentToFollowUp}
            onChange={(event) => updateLead("consentToFollowUp", event.target.checked)}
          />
          I consent to being contacted about this request.
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit lead"}
        </button>

        {state.status === "success" ? (
          <p role="status" className="success">
            Lead captured. Reference {state.leadId}.
          </p>
        ) : null}
        {state.status === "error" ? (
          <p role="alert" className="error">
            {state.message}
          </p>
        ) : null}
      </form>
    </main>
  );
}
