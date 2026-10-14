import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../server.js";

describe("Backend API Integration Tests", () => {
  const testUser = {
    id: "user_test_12345",
    email: "testuser@example.com",
    name: "Test Engineer",
  };

  const devHeaders = {
    "x-dev-user-id": testUser.id,
    "x-dev-user-email": testUser.email,
    "x-dev-user-name": testUser.name,
  };

  let createdDocId: string;
  let createdFolderId: string;

  it("GET /api/health should return ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("POST /api/folders creates a new folder", async () => {
    const res = await request(app)
      .post("/api/folders")
      .set(devHeaders)
      .send({ name: "Work Projects" });

    expect(res.status).toBe(201);
    expect(res.body.folder).toBeDefined();
    expect(res.body.folder.name).toBe("Work Projects");
    createdFolderId = res.body.folder.id;
  });

  it("POST /api/documents creates a new document", async () => {
    const res = await request(app)
      .post("/api/documents")
      .set(devHeaders)
      .send({
        title: "Architecture Roadmap",
        folderId: createdFolderId,
        content: { type: "doc", content: [] },
      });

    expect(res.status).toBe(201);
    expect(res.body.document).toBeDefined();
    expect(res.body.document.title).toBe("Architecture Roadmap");
    createdDocId = res.body.document.id;
  });

  it("GET /api/documents returns user documents with search filter", async () => {
    const res = await request(app)
      .get("/api/documents?search=Architecture")
      .set(devHeaders);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.documents)).toBe(true);
    expect(res.body.documents.length).toBeGreaterThan(0);
    expect(res.body.documents[0].id).toBe(createdDocId);
  });

  it("PATCH /api/documents/:id updates title and content", async () => {
    const res = await request(app)
      .patch(`/api/documents/${createdDocId}`)
      .set(devHeaders)
      .send({
        title: "Updated Architecture Roadmap 2026",
      });

    expect(res.status).toBe(200);
    expect(res.body.document.title).toBe("Updated Architecture Roadmap 2026");
  });

  it("POST /api/files/convert converts a .txt buffer into document content", async () => {
    const res = await request(app)
      .post("/api/files/convert")
      .set(devHeaders)
      .field("createDocument", "true")
      .field("title", "Imported Text Spec")
      .attach("file", Buffer.from("Hello world from unit test markdown file\n\nSecond paragraph content."), "test.txt");

    expect(res.status).toBe(201);
    expect(res.body.document).toBeDefined();
    expect(res.body.document.title).toBe("Imported Text Spec");
  });

  it("POST /api/invitations sends an invite for collaboration", async () => {
    const res = await request(app)
      .post("/api/invitations")
      .set(devHeaders)
      .send({
        documentId: createdDocId,
        email: "collaborator@example.com",
        role: "EDITOR",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.invitation).toBeDefined();
    expect(res.body.invitation.email).toBe("collaborator@example.com");
  }, 20000);

  it("POST /api/ai/chat returns structured editing action for grammar fixes", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .send({
        messages: [{ role: "user", content: "fix grammar and spelling" }],
        documentContext: {
          title: "Project Proposal",
          selectedText: "this are bad grammar text",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("assistant");
    expect(res.body.action).toBeDefined();
    expect(res.body.action.type).toBe("replace_selection");
  });

  it("POST /api/ai/chat returns structured action for document summary", async () => {
    const res = await request(app)
      .post("/api/ai/chat")
      .send({
        messages: [{ role: "user", content: "summarize this document" }],
        documentContext: {
          title: "Quarterly Goals",
          fullText: "Goal 1: Launch MVP. Goal 2: Expand to enterprise.",
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe("assistant");
    expect(res.body.action).toBeDefined();
    expect(res.body.action.content).toContain("Executive Summary");
  });
});
