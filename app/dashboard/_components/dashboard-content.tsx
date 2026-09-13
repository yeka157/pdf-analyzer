"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Notice from "@/components/notice";
import { extractTextFromPDF, validatePdfFile } from "@/lib/pdf-utils";
import Dropzone from "./dropzone";
import EmptyState from "./empty-state";
import ProcessingCard from "./processing-card";
import ReadFailedCard from "./read-failed-card";
import RecentList from "./recent-list";
import SummaryCard from "./summary-card";
import {
  type DigestDocument,
  formatAdded,
  formatPages,
  STATUS_LABEL,
} from "./types";

const DashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllersRef = useRef(new Map<string, AbortController>());
  const cancelledDocumentIdsRef = useRef(new Set<string>());

  const [documents, setDocuments] = useState<DigestDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState("");

  // Derive the initial banner state from the URL rather than setting it inside
  // an effect, which would trigger a second render pass on every mount.
  const [showPayments, setShowPayments] = useState(
    () => searchParams.get("payment") === "success"
  );

  useEffect(() => {
    if (!showPayments) {
      return;
    }

    router.replace("/dashboard");

    const timer = setTimeout(() => {
      setShowPayments(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [showPayments, router]);

  const selected =
    documents.find((document) => document.id === selectedId) ??
    documents[0] ??
    null;
  const isBusy = documents.some((doc) => doc.status === "reading");

  const updateDocument = useCallback(
    (id: string, patch: Partial<DigestDocument>) => {
      setDocuments((previous) =>
        previous.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc))
      );
    },
    []
  );

  const openPicker = useCallback(() => fileInputRef.current?.click(), []);

  const stopDocumentWork = useCallback((id: string) => {
    cancelledDocumentIdsRef.current.add(id);
    abortControllersRef.current.get(id)?.abort();
    abortControllersRef.current.delete(id);
  }, []);

  const removeDocument = useCallback(
    (id: string) => {
      stopDocumentWork(id);
      setDocuments((previous) =>
        previous.filter((document) => document.id !== id)
      );
      setSelectedId((previous) => (previous === id ? null : previous));
    },
    [stopDocumentWork]
  );

  const clearDocuments = useCallback(() => {
    setDocuments((previous) => {
      for (const document of previous) {
        stopDocumentWork(document.id);
      }
      return [];
    });
    setSelectedId(null);
  }, [stopDocumentWork]);

  const selectFile = useCallback((file: File) => {
    setValidationError("");

    const error = validatePdfFile(file);
    if (error) {
      setPendingFile(null);
      setValidationError(error);
      return;
    }

    setPendingFile(file);
  }, []);

  const runSummary = useCallback(
    async (file: File, retryId?: string) => {
      setValidationError("");
      setPendingFile(null);

      const id = retryId ?? crypto.randomUUID();
      cancelledDocumentIdsRef.current.delete(id);

      const wasCancelled = () => cancelledDocumentIdsRef.current.has(id);

      if (retryId) {
        updateDocument(id, {
          canRetry: false,
          error: undefined,
          status: "reading",
        });
      } else {
        setDocuments((previous) => [
          {
            addedAt: Date.now(),
            canRetry: false,
            file,
            id,
            keyTerms: [],
            name: file.name,
            pageCount: 0,
            status: "reading",
            summary: [],
          },
          ...previous,
        ]);
      }
      setSelectedId(id);

      let analysisStarted = false;

      try {
        const { text, pageCount } = await extractTextFromPDF(file);
        if (wasCancelled()) {
          return;
        }
        updateDocument(id, { pageCount });

        // A PDF of scanned images extracts cleanly and yields nothing. That is
        // a readable failure, not a server error, so it is caught here.
        if (text.trim() === "") {
          updateDocument(id, {
            canRetry: false,
            error:
              "The PDF has no selectable text. Scanned pages are not supported yet.",
            status: "failed",
          });
          return;
        }

        analysisStarted = true;
        const abortController = new AbortController();
        abortControllersRef.current.set(id, abortController);
        const response = await fetch("/api/analyze", {
          body: JSON.stringify({ text: text.slice(0, 10_000) }),
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "POST",
          signal: abortController.signal,
        });

        if (wasCancelled()) {
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const data = await response.json();
        if (wasCancelled()) {
          return;
        }

        updateDocument(id, {
          canRetry: false,
          keyTerms: Array.isArray(data.keyTerms) ? data.keyTerms : [],
          status: "done",
          summary: Array.isArray(data.summary) ? data.summary : [],
        });
      } catch (error) {
        if (wasCancelled()) {
          return;
        }

        updateDocument(id, {
          canRetry: analysisStarted,
          error:
            error instanceof Error ? error.message : "Failed to analyze PDF",
          status: "failed",
        });
      } finally {
        abortControllersRef.current.delete(id);
      }
    },
    [updateDocument]
  );

  const handleRun = async () => {
    if (!pendingFile) {
      setValidationError("Choose a file before running a summary.");
      return;
    }

    await runSummary(pendingFile);
  };

  const handleCancel = useCallback(() => {
    if (selected) {
      removeDocument(selected.id);
    }
  }, [removeDocument, selected]);

  const handleRetry = useCallback(async () => {
    if (selected) {
      await runSummary(selected.file, selected.id);
    }
  }, [runSummary, selected]);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const [file] = event.target.files ?? [];
      if (file) {
        selectFile(file);
      }
      // Allow re-picking the same file after a failed read.
      event.target.value = "";
    },
    [selectFile]
  );

  return (
    <div className="grid grid-cols-1 md:min-h-[calc(100vh-76px)] md:grid-cols-[296px_1fr]">
      <aside className="flex flex-col gap-5 px-5 py-6 md:gap-6 md:border-line md:border-r md:bg-surface md:p-6">
        <h1 className="t-page md:hidden">Documents</h1>

        <Dropzone disabled={isBusy} onBrowse={openPicker} onFile={selectFile} />

        {pendingFile ? (
          <div className="flex flex-col gap-3 border border-line bg-surface p-3.5 md:bg-surface-2">
            <div className="flex flex-col gap-1">
              <span className="t-label-sm text-meta">Selected</span>
              <span className="truncate font-medium text-[14px]">
                {pendingFile.name}
              </span>
            </div>
            <button
              className="btn btn-signal w-full py-3 text-[15px]"
              disabled={isBusy}
              onClick={handleRun}
              type="button"
            >
              {isBusy ? "Reading…" : "Run summary"}
            </button>
          </div>
        ) : null}

        <RecentList
          documents={documents}
          onClear={clearDocuments}
          onRemove={removeDocument}
          onSelect={setSelectedId}
          selectedId={selected?.id ?? null}
        />
      </aside>

      <main className="flex flex-col gap-5 px-5 py-6 md:gap-7 md:p-10">
        {showPayments ? (
          <Notice tone="success">Your plan is active.</Notice>
        ) : null}
        {validationError ? (
          <Notice tone="error">{validationError}</Notice>
        ) : null}

        {selected ? null : <EmptyState onUpload={openPicker} />}

        {selected?.status === "reading" ? (
          <ProcessingCard
            name={selected.name}
            onCancel={handleCancel}
            pageCount={selected.pageCount}
          />
        ) : null}

        {selected?.status === "failed" ? (
          <ReadFailedCard
            canRetry={selected.canRetry}
            message={selected.error ?? "The document could not be read."}
            onChooseAnother={openPicker}
            onRetry={handleRetry}
          />
        ) : null}

        {selected?.status === "done" ? (
          <>
            <div className="flex items-end justify-between gap-6">
              <div className="flex flex-col gap-2 overflow-hidden">
                <div className="t-page truncate">{selected.name}</div>
                <div className="t-meta text-meta">
                  {selected.pageCount > 0
                    ? `${formatPages(selected.pageCount)} · `
                    : ""}
                  {formatAdded(selected.addedAt)}
                </div>
              </div>
              <span className="pill shrink-0">
                {STATUS_LABEL[selected.status]}
              </span>
            </div>

            <SummaryCard
              keyTerms={selected.keyTerms}
              summary={selected.summary}
            />
          </>
        ) : null}
      </main>

      {/*
        `hidden` rather than sr-only: the labelled "Choose file" button is the
        control, and an sr-only input duplicates it for screen readers.
      */}
      <input
        accept="application/pdf,.pdf"
        aria-label="Upload PDF"
        hidden
        onChange={handleFileInputChange}
        ref={fileInputRef}
        type="file"
      />
    </div>
  );
};

export default DashboardContent;
