export type UploadRecord = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  extractionStatus: "pending" | "processing" | "ready" | "error";
  extractedText?: string;
  storagePath?: string;
  errorMessage?: string;
};

export type SourceContext = {
  excerpt: string;
  highlights: string[];
  rationale?: string;
  emphasisLabel?: string;
};
