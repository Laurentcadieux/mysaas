import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { Lead } from "./leadContract.js";

export interface LeadStore {
  createLead(lead: Lead): Lead;
  listLeads(limit?: number): Lead[];
}

export class LeadRepository implements LeadStore {
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
