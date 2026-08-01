import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  AgentSetup,
  CustomerRegistration,
  CustomerSummary,
  WorkspaceSetup
} from "./foundationContract.js";
import type { Lead } from "./leadContract.js";

export interface LeadStore {
  createLead(lead: Lead): Lead;
  listLeads(limit?: number): Lead[];
}

export interface ApplicationStore extends LeadStore {
  createCustomerRegistration(registration: CustomerRegistration): CustomerRegistration;
  createAgentSetup(setup: AgentSetup): AgentSetup;
  createWorkspaceSetup(setup: WorkspaceSetup): WorkspaceSetup;
  getWorkspaceSetup(organizationId: string): WorkspaceSetup | undefined;
  listCustomerSummaries(limit?: number): CustomerSummary[];
}

export class LeadRepository implements ApplicationStore {
  private readonly db: DatabaseSync;

  constructor(databasePath: string) {
    if (databasePath !== ":memory:") {
      mkdirSync(dirname(databasePath), { recursive: true });
    }
    this.db = new DatabaseSync(databasePath);
    this.initialize();
  }

  close(): void {
    this.db.close();
  }

  createLead(lead: Lead): Lead {
    this.db
      .prepare(
        `insert into leads (
          id, first_name, last_name, email, phone, company, service_interest,
          business_challenge, budget, timeline, preferred_contact_method,
          consent_to_follow_up, source, status, qualification_level, urgency,
          purchase_intent, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        lead.id,
        lead.firstName,
        lead.lastName,
        lead.email,
        lead.phone,
        lead.company,
        lead.serviceInterest,
        lead.businessChallenge,
        lead.budget,
        lead.timeline,
        lead.preferredContactMethod,
        lead.consentToFollowUp ? 1 : 0,
        lead.source,
        lead.status,
        lead.qualificationLevel,
        lead.urgency,
        lead.purchaseIntent,
        lead.createdAt,
        lead.updatedAt
      );

    return lead;
  }

  listLeads(limit = 100): Lead[] {
    return this.db
      .prepare("select * from leads order by created_at desc limit ?")
      .all(limit)
      .map(rowToLead);
  }

  createCustomerRegistration(registration: CustomerRegistration): CustomerRegistration {
    this.db.exec("begin");
    try {
      this.insertOrganization(registration.organization);
      this.db
        .prepare("insert into users (id, full_name, email, created_at) values (?, ?, ?, ?)")
        .run(
          registration.owner.id,
          registration.owner.fullName,
          registration.owner.email,
          registration.owner.createdAt
        );
      this.insertMembership(registration.membership);
      this.insertSubscription(registration.subscription);
      this.db.exec("commit");
    } catch (error) {
      this.db.exec("rollback");
      throw error;
    }

    return registration;
  }

  createAgentSetup(setup: AgentSetup): AgentSetup {
    const organization = this.db
      .prepare("select id from organizations where id = ?")
      .get(setup.project.organizationId);
    if (!organization) {
      throw new Error("Organization not found.");
    }

    this.db.exec("begin");
    try {
      this.insertProject(setup.project);
      this.insertAgent(setup.agent);
      this.db.exec("commit");
    } catch (error) {
      this.db.exec("rollback");
      throw error;
    }

    return setup;
  }

  createWorkspaceSetup(setup: WorkspaceSetup): WorkspaceSetup {
    this.db.exec("begin");
    try {
      this.insertOrganization(setup.organization);
      this.db
        .prepare("insert into users (id, full_name, email, created_at) values (?, ?, ?, ?)")
        .run(setup.owner.id, setup.owner.fullName, setup.owner.email, setup.owner.createdAt);
      this.insertMembership(setup.membership);
      this.insertSubscription(setup.subscription);
      this.insertProject(setup.project);
      this.insertAgent(setup.agent);
      this.db.exec("commit");
    } catch (error) {
      this.db.exec("rollback");
      throw error;
    }

    return setup;
  }

  getWorkspaceSetup(organizationId: string): WorkspaceSetup | undefined {
    const row = this.db
      .prepare(
        `select
          organizations.id as organization_id,
          organizations.name as organization_name,
          organizations.website as organization_website,
          organizations.created_at as organization_created_at,
          users.id as owner_id,
          users.full_name as owner_full_name,
          users.email as owner_email,
          users.created_at as owner_created_at,
          memberships.id as membership_id,
          memberships.role as membership_role,
          memberships.status as membership_status,
          memberships.created_at as membership_created_at,
          subscriptions.id as subscription_id,
          subscriptions.plan_code as subscription_plan_code,
          subscriptions.status as subscription_status,
          subscriptions.current_period_start as subscription_current_period_start,
          subscriptions.current_period_end as subscription_current_period_end,
          subscriptions.created_at as subscription_created_at,
          projects.id as project_id,
          projects.name as project_name,
          projects.objective as project_objective,
          projects.status as project_status,
          projects.created_at as project_created_at,
          agents.id as agent_id,
          agents.type as agent_type,
          agents.name as agent_name,
          agents.objective as agent_objective,
          agents.greeting as agent_greeting,
          agents.instructions as agent_instructions,
          agents.qualification_questions as agent_qualification_questions,
          agents.status as agent_status,
          agents.created_at as agent_created_at
        from organizations
        join memberships on memberships.organization_id = organizations.id
        join users on users.id = memberships.user_id
        join subscriptions on subscriptions.organization_id = organizations.id
        join projects on projects.organization_id = organizations.id
        join agents on agents.project_id = projects.id
        where organizations.id = ?
        limit 1`
      )
      .get(organizationId);

    return row ? rowToWorkspaceSetup(row) : undefined;
  }

  listCustomerSummaries(limit = 100): CustomerSummary[] {
    return this.db
      .prepare(
        `select
          organizations.id as organization_id,
          organizations.name as organization_name,
          organizations.website as organization_website,
          organizations.created_at as organization_created_at,
          users.full_name as owner_full_name,
          users.email as owner_email,
          subscriptions.plan_code as subscription_plan_code,
          subscriptions.status as subscription_status,
          count(distinct projects.id) as project_count,
          count(distinct agents.id) as agent_count
        from organizations
        join memberships on memberships.organization_id = organizations.id
        join users on users.id = memberships.user_id
        join subscriptions on subscriptions.organization_id = organizations.id
        left join projects on projects.organization_id = organizations.id
        left join agents on agents.organization_id = organizations.id
        group by organizations.id
        order by organizations.created_at desc
        limit ?`
      )
      .all(limit)
      .map(rowToCustomerSummary);
  }

  getSchemaVersion(): number {
    const row = this.db.prepare("select version from schema_meta where id = 1").get();
    return Number(row?.version ?? 0);
  }

  private initialize(): void {
    this.db.exec(`
      create table if not exists schema_meta (
        id integer primary key check (id = 1),
        version integer not null,
        updated_at text not null
      );

      create table if not exists leads (
        id text primary key,
        first_name text not null,
        last_name text not null,
        email text not null,
        phone text not null,
        company text not null,
        service_interest text not null,
        business_challenge text not null,
        budget text not null,
        timeline text not null,
        preferred_contact_method text not null,
        consent_to_follow_up integer not null,
        source text not null,
        status text not null,
        qualification_level text not null,
        urgency text not null,
        purchase_intent text not null,
        created_at text not null,
        updated_at text not null
      );

      insert into schema_meta (id, version, updated_at)
      values (1, 1, datetime('now'))
      on conflict(id) do nothing;
    `);

    if (this.getSchemaVersion() < 2) {
      this.db.exec(`
        create table if not exists organizations (
          id text primary key,
          name text not null,
          website text not null,
          created_at text not null
        );

        create table if not exists users (
          id text primary key,
          full_name text not null,
          email text not null,
          created_at text not null
        );

        create table if not exists memberships (
          id text primary key,
          organization_id text not null references organizations(id),
          user_id text not null references users(id),
          role text not null,
          status text not null,
          created_at text not null
        );

        create table if not exists plans (
          code text primary key,
          name text not null,
          monthly_price_cents integer not null,
          included_agents integer not null,
          included_team_members integer not null,
          monthly_conversations integer not null,
          created_at text not null
        );

        create table if not exists subscriptions (
          id text primary key,
          organization_id text not null references organizations(id),
          plan_code text not null references plans(code),
          status text not null,
          current_period_start text not null,
          current_period_end text not null,
          created_at text not null
        );

        create table if not exists projects (
          id text primary key,
          organization_id text not null references organizations(id),
          name text not null,
          objective text not null,
          status text not null,
          created_at text not null
        );

        create table if not exists agents (
          id text primary key,
          organization_id text not null references organizations(id),
          project_id text not null references projects(id),
          type text not null,
          name text not null,
          objective text not null,
          status text not null,
          created_at text not null
        );

        insert into plans (
          code, name, monthly_price_cents, included_agents, included_team_members,
          monthly_conversations, created_at
        ) values
          ('lead-starter', 'Lead Starter', 4900, 1, 3, 500, datetime('now')),
          ('lead-professional', 'Lead Professional', 14900, 5, 10, 2500, datetime('now')),
          ('advice-professional', 'Advice Professional', 29900, 5, 10, 2500, datetime('now'))
        on conflict(code) do nothing;

        update schema_meta
        set version = 2, updated_at = datetime('now')
        where id = 1;
      `);
    }

    if (this.getSchemaVersion() < 3) {
      this.db.exec(`
        alter table agents add column greeting text not null default '';
        alter table agents add column instructions text not null default '';
        alter table agents add column qualification_questions text not null default '';

        update schema_meta
        set version = 3, updated_at = datetime('now')
        where id = 1;
      `);
    }
  }

  private insertOrganization(organization: WorkspaceSetup["organization"]): void {
    this.db
      .prepare("insert into organizations (id, name, website, created_at) values (?, ?, ?, ?)")
      .run(organization.id, organization.name, organization.website, organization.createdAt);
  }

  private insertMembership(membership: WorkspaceSetup["membership"]): void {
    this.db
      .prepare(
        `insert into memberships (
          id, organization_id, user_id, role, status, created_at
        ) values (?, ?, ?, ?, ?, ?)`
      )
      .run(
        membership.id,
        membership.organizationId,
        membership.userId,
        membership.role,
        membership.status,
        membership.createdAt
      );
  }

  private insertSubscription(subscription: WorkspaceSetup["subscription"]): void {
    this.db
      .prepare(
        `insert into subscriptions (
          id, organization_id, plan_code, status, current_period_start,
          current_period_end, created_at
        ) values (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        subscription.id,
        subscription.organizationId,
        subscription.planCode,
        subscription.status,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd,
        subscription.createdAt
      );
  }

  private insertProject(project: WorkspaceSetup["project"]): void {
    this.db
      .prepare(
        "insert into projects (id, organization_id, name, objective, status, created_at) values (?, ?, ?, ?, ?, ?)"
      )
      .run(
        project.id,
        project.organizationId,
        project.name,
        project.objective,
        project.status,
        project.createdAt
      );
  }

  private insertAgent(agent: WorkspaceSetup["agent"]): void {
    this.db
      .prepare(
        `insert into agents (
          id, organization_id, project_id, type, name, objective, greeting,
          instructions, qualification_questions, status, created_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        agent.id,
        agent.organizationId,
        agent.projectId,
        agent.type,
        agent.name,
        agent.objective,
        agent.greeting,
        agent.instructions,
        agent.qualificationQuestions,
        agent.status,
        agent.createdAt
      );
  }
}

function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    email: String(row.email),
    phone: String(row.phone),
    company: String(row.company),
    serviceInterest: String(row.service_interest),
    businessChallenge: String(row.business_challenge),
    budget: String(row.budget),
    timeline: String(row.timeline),
    preferredContactMethod: String(row.preferred_contact_method) as Lead["preferredContactMethod"],
    consentToFollowUp: true,
    source: String(row.source),
    status: String(row.status) as Lead["status"],
    qualificationLevel: String(row.qualification_level) as Lead["qualificationLevel"],
    urgency: String(row.urgency) as Lead["urgency"],
    purchaseIntent: String(row.purchase_intent) as Lead["purchaseIntent"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function rowToWorkspaceSetup(row: Record<string, unknown>): WorkspaceSetup {
  const organizationId = String(row.organization_id);
  const ownerId = String(row.owner_id);
  const projectId = String(row.project_id);

  return {
    organization: {
      id: organizationId,
      name: String(row.organization_name),
      website: String(row.organization_website),
      createdAt: String(row.organization_created_at)
    },
    owner: {
      id: ownerId,
      fullName: String(row.owner_full_name),
      email: String(row.owner_email),
      createdAt: String(row.owner_created_at)
    },
    membership: {
      id: String(row.membership_id),
      organizationId,
      userId: ownerId,
      role: String(row.membership_role) as "owner",
      status: String(row.membership_status) as "active",
      createdAt: String(row.membership_created_at)
    },
    subscription: {
      id: String(row.subscription_id),
      organizationId,
      planCode: String(row.subscription_plan_code) as "lead-starter",
      status: String(row.subscription_status) as "trialing",
      currentPeriodStart: String(row.subscription_current_period_start),
      currentPeriodEnd: String(row.subscription_current_period_end),
      createdAt: String(row.subscription_created_at)
    },
    project: {
      id: projectId,
      organizationId,
      name: String(row.project_name),
      objective: String(row.project_objective),
      status: String(row.project_status) as "draft",
      createdAt: String(row.project_created_at)
    },
    agent: {
      id: String(row.agent_id),
      organizationId,
      projectId,
      type: String(row.agent_type) as "lead-generation",
      name: String(row.agent_name),
      objective: String(row.agent_objective),
      greeting: String(row.agent_greeting),
      instructions: String(row.agent_instructions),
      qualificationQuestions: String(row.agent_qualification_questions),
      status: String(row.agent_status) as "draft",
      createdAt: String(row.agent_created_at)
    }
  };
}

function rowToCustomerSummary(row: Record<string, unknown>): CustomerSummary {
  return {
    organizationId: String(row.organization_id),
    organizationName: String(row.organization_name),
    website: String(row.organization_website),
    ownerName: String(row.owner_full_name),
    ownerEmail: String(row.owner_email),
    planCode: String(row.subscription_plan_code),
    subscriptionStatus: String(row.subscription_status),
    projectCount: Number(row.project_count ?? 0),
    agentCount: Number(row.agent_count ?? 0),
    createdAt: String(row.organization_created_at)
  };
}
