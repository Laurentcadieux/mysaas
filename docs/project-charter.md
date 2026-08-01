# AdviceConnect Project Charter

## 1. Overview

AdviceConnect is a multi-tenant SaaS platform that lets businesses create, publish, and manage conversational agents on their websites.

The platform has two primary offerings:

- Lead-generation conversational agents that capture visitor information, extract indicators from conversation payloads, and populate a structured lead table.
- Advisory conversational agents that provide personalized guidance based on a customer's services, products, technology, documents, or knowledge.

AdviceConnect should be simple, business-focused, and fast to deploy. A customer should be able to create an account, configure an agent, and add it to a website without needing deep technical expertise.

## 2. Brand

| Field | Value |
| --- | --- |
| Product name | AdviceConnect |
| Positioning | Connect businesses with prospects and customers through intelligent conversations |
| Primary tagline | Turn conversations into leads, insights, and advice |
| Alternate tagline | From first conversation to trusted advice |
| French tagline | Transformez les conversations en prospects, donnees et conseils |

The name supports both core use cases:

- Connecting a business with new leads.
- Connecting a customer with useful advice.

## 3. Business Objective

AdviceConnect helps businesses deploy conversational agents without building their own artificial intelligence, voice, lead-management, or extraction infrastructure.

The platform should help customers:

- Generate leads through natural conversations.
- Capture structured information from website visitors.
- Identify important indicators from each conversation.
- Automatically populate a lead-management table.
- Qualify prospects before a sales representative contacts them.
- Deploy conversational agents quickly on a website.
- Provide premium paid advisory conversations.
- Manage users, agents, leads, customers, and projects in one portal.
- Pay a clear fixed monthly price.

## 4. Problem Statement

Many companies want conversational artificial intelligence but face barriers:

- Conversational solutions are technically complex.
- Chatbot tools often require several integrations.
- Conversation data is difficult to structure.
- Lead qualification requires manual review.
- Publishing an agent to a website is not always simple.
- Advisory experiences require knowledge, security, and billing controls.
- Usage-based pricing can make costs unpredictable.

AdviceConnect simplifies agent configuration, website publishing, payload processing, extraction, lead management, and optional advisory services.

## 5. Product Vision

A business should be able to:

1. Create a company account.
2. Invite team members.
3. Create a project.
4. Configure a lead-generation agent.
5. Select the information and indicators to extract.
6. Publish the agent on a website.
7. Receive structured conversation payloads.
8. Automatically populate a lead table.
9. Review and manage prospects.
10. Upgrade to an advanced advisory agent.
11. Charge customers for access to specialized advice where applicable.
12. Pay a fixed monthly fee for the selected service level.

## 6. Core Offering

### Tier 1 - Lead Generation Agent

The lead-generation agent gives businesses a simple way to capture and qualify prospects.

It should:

- Be created through a guided setup process.
- Ask configurable questions.
- Capture contact information.
- Identify visitor needs.
- Extract variables and indicators.
- Receive and process conversation payloads.
- Populate a structured lead table.
- Create a conversation record.
- Store the transcript.
- Support business follow-up.
- Be published through an embed code or hosted link.

### Tier 2 - Advisory Agent

The advisory agent provides a deeper conversational experience using:

- Company technology details.
- Product information.
- Service information.
- Documentation.
- Frequently asked questions.
- Industry expertise.
- Proprietary knowledge.
- Approved business rules.

It may:

- Provide personalized recommendations.
- Ask diagnostic questions.
- Use customer-specific knowledge.
- Generate consultation summaries.
- Offer paid conversations.
- Restrict access to paying customers.
- Track advisory sessions.
- Collect payment before a session.
- Create follow-up opportunities.
- Escalate to a human advisor.

## 7. Website Positioning

The public website must quickly answer:

| Question | Answer |
| --- | --- |
| What do we do? | We help businesses create conversational agents for lead generation and paid advisory services. |
| Why do we do it? | Businesses need a simple way to turn website conversations into structured opportunities without building complex AI infrastructure. |
| What is the benefit? | Capture more leads, understand customer needs, reduce manual qualification, and create new advisory revenue opportunities. |

Recommended homepage structure:

- Hero: Turn website conversations into qualified leads.
- Primary action: Create Your Agent.
- Secondary action: See How It Works.
- Value statement.
- How it works.
- Core benefits.
- Lead generation section.
- Advisory section.
- Pricing section.
- Final call to action.

## 8. Target Users

| User | Description |
| --- | --- |
| Organization owner | Manages account, subscription, team, and configuration |
| Organization team member | Creates agents, manages leads, reviews conversations, monitors results |
| Sales and marketing user | Handles lead generation, qualification, follow-up, and conversion |
| Website visitor | Interacts with the lead-generation agent |
| Advisory customer | Accesses free or paid advisory conversations |
| Platform administrator | Manages tenants, billing, support, usage, and system monitoring |

## 9. MVP Scope

### Account And Organization Management

- Account creation.
- Company profile.
- Team invitations.
- Basic roles.
- Active/inactive users.
- Selected plan.
- Billing status.
- Organization settings.

### User Classification

- Organization owners.
- Organization team members.
- Website visitors.
- Leads.
- Qualified leads.
- Free advisory users.
- Paying advisory customers.
- Platform administrators.

### Project Management

- Create projects.
- Associate agents with projects.
- Define project objectives.
- Configure project-specific fields.
- Review project activity.
- Activate, deactivate, or archive projects.

### Agent Builder

- Create an agent.
- Select agent type.
- Name the agent.
- Define objective.
- Configure greeting and instructions.
- Define questions.
- Define required and optional fields.
- Select indicators to extract.
- Preview and test the agent.
- Publish or deactivate the agent.

### Extracted Variables And Indicators

Variables may include:

- First name.
- Last name.
- Email address.
- Phone number.
- Company.
- Job title.
- Product or service interest.
- Business challenge.
- Budget.
- Timeline.
- Urgency.
- Purchase intent.
- Qualification level.
- Sentiment.
- Preferred contact method.
- Consent to follow up.
- Recommended next step.
- Custom project fields.

Indicators may include:

- High-value opportunity.
- Immediate follow-up required.
- Strong purchase intent.
- Existing customer.
- Technical requirement.
- Advisory opportunity.
- Low qualification.
- Missing information.
- Human follow-up recommended.

### ElevenLabs Integration

AdviceConnect will integrate with ElevenLabs to:

- Create or connect conversational agents.
- Start conversations.
- Receive transcripts.
- Receive completion events.
- Receive structured payloads.
- Capture extracted variables.
- Store provider identifiers.
- Track session metadata.
- Support troubleshooting.

### Payload Processing

The platform will:

- Receive conversation payloads.
- Validate events.
- Store original payloads.
- Identify organization, project, and agent.
- Extract configured variables and indicators.
- Create or update leads.
- Store transcripts and metadata.
- Flag processing errors.
- Prevent duplicate processing.

### Lead Table

Each completed lead-generation conversation feeds a structured table with:

- Lead name.
- Company.
- Email.
- Phone.
- Conversation date.
- Agent.
- Project.
- Lead status.
- Qualification level.
- Intent.
- Urgency.
- Estimated value.
- Recommended action.
- Assigned owner.
- Payment status.
- Last activity.

Users can search, filter, sort, view details, review transcripts, edit values, add notes, assign ownership, change status, and export records.

### Website Publishing

Supported publishing options:

- JavaScript embed code.
- Website widget.
- Iframe.
- Hosted link.
- Website button.
- QR code in a future phase.

Basic appearance settings:

- Company name and logo.
- Agent name.
- Welcome message.
- Button text.
- Widget position.
- Primary color.
- Call-to-action text.

### Billing

AdviceConnect will use fixed monthly subscription pricing. Plans define:

- Number of agents.
- Team members.
- Monthly conversations.
- Projects.
- Data retention.
- Export capabilities.
- Branding capabilities.
- Advisory-agent access.
- Knowledge-source limits.
- Support level.

Stripe or another billing provider may manage subscriptions, payment methods, invoices, plan changes, payment failures, renewals, cancellations, and advisory-session payments.

## 10. Suggested Pricing Tiers

| Tier | Target Customer | Included Capabilities |
| --- | --- | --- |
| Lead Starter | Small businesses needing one simple lead-generation agent | One agent, one project, basic lead table, standard fields, website embed, basic dashboard |
| Lead Professional | Businesses with multiple campaigns or agents | Multiple agents/projects, custom variables, advanced indicators, exports, more team members and conversations |
| Advice Professional | Businesses offering advanced guidance | Lead-generation plus advisory agents, knowledge sources, session summaries, advisory reporting |
| Advice Business | Higher-volume businesses needing more control | Multiple advisory agents, expanded knowledge sources, more users, advanced reporting, priority support, custom branding |

Additional usage should use clearly defined conversation bundles rather than unpredictable metered pricing.

## 11. Customer Portal

Portal areas:

- Dashboard.
- Agents.
- Leads.
- Customers.
- Projects.
- Team.
- Billing.

Dashboard metrics:

- Total conversations.
- Total leads.
- Qualified leads.
- High-priority leads.
- Active agents.
- Conversion rate.
- Advisory sessions.
- Paying customers.

## 12. Platform Roles

| Role | Capabilities |
| --- | --- |
| Platform administrator | Manage all organizations, plans, usage, support, and platform configuration |
| Organization owner | Manage company, subscription, team, projects, agents, and billing |
| Organization administrator | Manage users, projects, agents, leads, and settings |
| Agent manager | Create, edit, test, and publish agents |
| Sales user | Review leads, transcripts, indicators, assignments, and statuses |
| Reporting user | Review dashboards and reports without changing data |

## 13. High-Level Data Model

Core entities:

- Organization.
- User.
- Membership.
- Role.
- Subscription.
- Plan.
- Project.
- Agent.
- Agent type.
- Agent configuration.
- Agent variable.
- Extraction indicator.
- Deployment.
- Conversation.
- Transcript.
- Conversation payload.
- Extracted value.
- Lead.
- Customer.
- Advisory session.
- Payment.
- Knowledge source.
- Note.
- Assignment.
- Audit event.

## 14. MVP Customer Journey

1. Business visits AdviceConnect.
2. Business understands the service from the homepage.
3. Business selects a plan.
4. Owner creates an account and organization.
5. Owner invites team members.
6. User creates a project.
7. User selects Lead Generation Agent.
8. User defines fields and indicators.
9. User tests the agent.
10. AdviceConnect generates an embed code.
11. Business adds the agent to its website.
12. Visitor starts a conversation.
13. ElevenLabs manages the conversation.
14. AdviceConnect receives the payload.
15. Platform extracts configured information.
16. Lead is added to the table.
17. Business reviews the lead and transcript.
18. Business follows up with the prospect.
19. Business may upgrade to an advisory plan.
20. Business creates an advanced advisory agent.
21. End customer accesses or purchases an advisory session.

## 15. Non-Functional Requirements

### Simplicity

- Non-technical users should understand the product.
- Creating and publishing the first agent should require minimal steps.

### Security

- Secure authentication.
- Role-based access.
- Tenant isolation.
- Encrypted communication.
- Secure secret management.
- Secure webhook validation.
- Audit logging.
- Protection against common web attacks.

### Privacy

- Consent notices.
- Data-retention controls.
- Data deletion.
- Export capability.
- Privacy-request support.
- Customer control over collected fields.
- Notification that conversations may be recorded or processed by AI.

### Reliability

- Webhook retry handling.
- Duplicate-event protection.
- Automated backups.
- Error monitoring.
- Processing status.
- Recovery procedures.

### Scalability

Scale across organizations, users, agents, website deployments, conversations, payloads, leads, advisory sessions, and knowledge sources.

## 16. Success Metrics

- Organizations registered.
- Active paying organizations.
- Time to create first agent.
- Agents successfully published.
- Conversations.
- Leads generated.
- Lead completion rate.
- Valid structured data rate.
- Lead qualification rate.
- Trial-to-paid conversion.
- Monthly recurring revenue.
- Customer retention.
- Advisory-plan adoption.
- Paid advisory sessions.
- Payload-processing success.
- Support-request volume.

## 17. MVP Acceptance Criteria

The MVP is ready when:

- A business can register.
- An organization can be created.
- Team members can be invited.
- A lead-generation project can be created.
- An agent can be configured and tested.
- Variables and indicators can be selected.
- An embed code can be generated.
- The agent can run on a website.
- AdviceConnect can receive an ElevenLabs payload.
- Payloads map to the correct organization, project, and agent.
- Extracted data populates a lead table.
- A transcript can be reviewed.
- Lead status can be updated.
- A monthly subscription can be purchased.
- Plan limits can be enforced.
- The platform can identify free users, leads, and paying customers.
- A basic advisory agent can be configured under a premium plan.

## 18. Delivery Phases

| Phase | Focus |
| --- | --- |
| 1 | Authentication, organizations, invitations, roles, database, subscriptions, fixed monthly plans |
| 2 | Lead-agent builder, projects, configuration, variables, indicators, preview, testing |
| 3 | Website publishing, widget, hosted page, embed code, branding, deployment status |
| 4 | ElevenLabs webhooks, payload storage, extraction, indicators, lead table, transcripts |
| 5 | Customer portal, dashboard, agent management, lead management, notes, assignments, export |
| 6 | Advisory agent, knowledge sources, paid sessions, summaries, advisory reporting |
| 7 | Security, privacy, performance, monitoring, backups, onboarding, pilot launch |

## 19. Out Of Scope For Initial MVP

- Full CRM replacement.
- Advanced marketing automation.
- Native mobile apps.
- Multiple conversational AI providers.
- Advanced reseller management.
- Complex revenue-sharing.
- Custom machine-learning training.
- Enterprise SSO.
- Advanced contact-center functionality.
- Outbound calling.
- Complex workflow automation.
- Marketplace capabilities.
- Deep CRM integrations.
- Advanced attribution reporting.

## 20. Outcome

The AdviceConnect MVP will let businesses create conversational lead-generation agents, publish them on websites, extract structured information and indicators, and populate a lead-management table.

Customers requiring a more advanced experience can upgrade to premium advisory agents based on their own products, technology, services, expertise, or documentation.

AdviceConnect is positioned as a simple, direct, predictable SaaS product with fixed monthly pricing.
