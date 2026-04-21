import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetDatabase } from "@/lib/db/client";
import { buildSourceContext } from "@/lib/server/uploads/source-intelligence";
import { createUpload, getUploadById } from "@/lib/server/uploads/upload-service";

const { mockedPdfParse } = vi.hoisted(() => ({
  mockedPdfParse: vi.fn(async () => ({ text: "Default PDF text" })),
}));

vi.mock("pdf-parse", () => ({
  default: mockedPdfParse,
}));

function createTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lessonflow-upload-test-"));
  return path.join(dir, "app.db");
}

describe("upload-service", () => {
  beforeEach(() => {
    resetDatabase();
    process.env.LESSONFLOW_DB_PATH = createTempDbPath();
    mockedPdfParse.mockReset();
    mockedPdfParse.mockImplementation(async () => ({ text: "Default PDF text" }));
  });

  it("stores and extracts a text document", async () => {
    const file = new File(
      ["Thermodynamics studies heat, work, and energy transfer."],
      "thermodynamics.txt",
      {
        type: "text/plain",
      },
    );

    const upload = await createUpload(file);
    const loaded = await getUploadById(upload.id);

    expect(upload.extractionStatus).toBe("ready");
    expect(upload.extractedText).toContain("Thermodynamics");
    expect(loaded?.filename).toBe("thermodynamics.txt");
  });

  it("trims extracted text before storing it", async () => {
    const file = new File(["  Heat and work matter.  "], "notes.txt", {
      type: "text/plain",
    });

    const upload = await createUpload(file);

    expect(upload.extractedText).toBe("Heat and work matter.");
  });

  it("can derive a relevant source excerpt from extracted upload text", async () => {
    const file = new File(
      [
        "Thermodynamics studies energy and work.\n\nHeat transfer includes conduction, convection, and radiation.\n\nEntropy helps describe directionality.",
      ],
      "notes.txt",
      {
        type: "text/plain",
      },
    );

    const upload = await createUpload(file);
    const context = buildSourceContext({
      lessonPrompt: "Teach me heat transfer.",
      outlineTitle: "Heat transfer",
      sourceText: upload.extractedText,
    });

    expect(context?.excerpt).toContain("Heat transfer includes conduction");
  });

  it("fails fast when PDF extraction takes too long", async () => {
    mockedPdfParse.mockImplementation(() => new Promise(() => {}));

    const file = new File(["pretend-pdf"], "slow.pdf", {
      type: "application/pdf",
    });

    const upload = await createUpload(file, { pdfTimeoutMs: 10 });

    expect(upload.extractionStatus).toBe("error");
    expect(upload.errorMessage).toContain("PDF text extraction took too long");
  }, 10_000);
});
