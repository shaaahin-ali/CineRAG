"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  SlidersHorizontal,
  ArrowUp,
  X,
  FileText,
  ChevronDown,
  Check,
  Loader2,
  AlertCircle,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// Types
export interface FileWithPreview {
  id: string;
  file: File;
  preview?: string;
  type: string;
  uploadStatus: "pending" | "uploading" | "complete" | "error";
  uploadProgress?: number;
  abortController?: AbortController;
  textContent?: string;
}

export interface PastedContent {
  id: string;
  content: string;
  timestamp: Date;
  wordCount: number;
}

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  badge?: string;
}

interface ChatInputProps {
  onSendMessage?: (
    message: string,
    files: FileWithPreview[],
    pastedContent: PastedContent[],
  ) => void;
  disabled?: boolean;
  placeholder?: string;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  models?: ModelOption[];
  defaultModel?: string;
  onModelChange?: (modelId: string) => void;
}

// Constants
const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const PASTE_THRESHOLD = 200; // characters threshold for showing as pasted content
const DEFAULT_MODELS_INTERNAL: ModelOption[] = [
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    description: "Balanced model",
    badge: "Latest",
  },
  {
    id: "claude-opus-3.5",
    name: "Claude Opus 3.5",
    description: "Highest intelligence",
  },
  {
    id: "claude-haiku-3",
    name: "Claude Haiku 3",
    description: "Fastest responses",
  },
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const getFileExtension = (filename: string): string => {
  const extension = filename.split(".").pop()?.toUpperCase() || "FILE";
  return extension.length > 8 ? `${extension.slice(0, 8)}...` : extension;
};

const getFileTypeLabel = (type: string): string => {
  const parts = type.split("/");
  let label = parts[parts.length - 1].toUpperCase();
  if (label.length > 7 && label.includes("-")) {
    label = label.substring(0, label.indexOf("-"));
  }
  return label.length > 10 ? `${label.substring(0, 10)}...` : label;
};

const isTextualFile = (file: File): boolean => {
  const textualTypes = [
    "text/",
    "application/json",
    "application/xml",
    "application/javascript",
    "application/typescript",
  ];

  const textualExtensions = [
    "txt",
    "md",
    "py",
    "js",
    "ts",
    "jsx",
    "tsx",
    "html",
    "htm",
    "css",
    "scss",
    "sass",
    "json",
    "xml",
    "yaml",
    "yml",
    "csv",
    "sql",
    "sh",
    "bash",
    "php",
    "rb",
    "go",
    "java",
    "c",
    "cpp",
    "h",
    "hpp",
    "cs",
    "rs",
    "swift",
    "kt",
    "scala",
    "r",
    "vue",
    "svelte",
    "astro",
    "config",
    "conf",
    "ini",
    "toml",
    "log",
    "gitignore",
    "dockerfile",
    "makefile",
    "readme",
  ];

  const isTextualMimeType = textualTypes.some((type) =>
    file.type.toLowerCase().startsWith(type),
  );
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const isTextualExtension =
    textualExtensions.includes(extension) ||
    file.name.toLowerCase().includes("readme") ||
    file.name.toLowerCase().includes("dockerfile") ||
    file.name.toLowerCase().includes("makefile");

  return isTextualMimeType || isTextualExtension;
};

const readFileAsText = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve((event.target?.result as string) || "");
    reader.onerror = (event) => reject(event);
    reader.readAsText(file);
  });

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

// File Preview Component
const FilePreviewCard: React.FC<{
  file: FileWithPreview;
  onRemove: (id: string) => void;
}> = ({ file, onRemove }) => {
  const isImage = file.type.startsWith("image/");
  const isTextual = isTextualFile(file.file);

  if (isTextual) {
    return <TextualFilePreviewCard file={file} onRemove={onRemove} />;
  }

  return (
    <div className="group relative h-[132px] w-[132px] shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      {isImage && file.preview ? (
        <Image
          src={file.preview}
          alt={file.file.name}
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col justify-between p-3">
          <div className="flex items-center justify-between text-zinc-500">
            <FileText className="h-4 w-4" />
            {file.uploadStatus === "uploading" && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />
            )}
            {file.uploadStatus === "error" && (
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            )}
          </div>
          <div>
            <p
              className="truncate text-xs font-medium text-zinc-100"
              title={file.file.name}
            >
              {file.file.name}
            </p>
            <p className="mt-1 text-[10px] text-zinc-500">
              {formatFileSize(file.file.size)}
            </p>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/55" />
      <p className="absolute bottom-2 left-2 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
        {getFileTypeLabel(file.type)}
      </p>
      <Button
        size="icon"
        variant="outline"
        className="absolute right-2 top-2 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={() => onRemove(file.id)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

// Pasted Content Preview Component
const PastedContentCard: React.FC<{
  content: PastedContent;
  onRemove: (id: string) => void;
}> = ({ content, onRemove }) => {
  const previewText = content.content.slice(0, 150);
  const needsTruncation = content.content.length > 150;

  return (
    <div className="group relative h-[132px] w-[132px] shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <div className="max-h-[92px] overflow-y-auto whitespace-pre-wrap break-words text-[11px] leading-4 text-zinc-300 custom-scrollbar">
        {needsTruncation ? `${previewText}...` : content.content}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/55" />
      <p className="absolute bottom-2 left-2 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
        PASTED
      </p>
      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <Button
          size="icon"
          variant="outline"
          className="h-6 w-6 p-0"
          onClick={() => navigator.clipboard.writeText(content.content)}
          title="Copy content"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="h-6 w-6 p-0"
          onClick={() => onRemove(content.id)}
          title="Remove content"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// Textual File Preview Component
const TextualFilePreviewCard: React.FC<{
  file: FileWithPreview;
  onRemove: (id: string) => void;
}> = ({ file, onRemove }) => {
  const previewText = file.textContent?.slice(0, 150) || "";
  const needsTruncation = (file.textContent?.length || 0) > 150;
  const fileExtension = getFileExtension(file.file.name);

  return (
    <div className="group relative h-[132px] w-[132px] shrink-0 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.04] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <div className="max-h-[92px] overflow-y-auto whitespace-pre-wrap break-words text-[11px] leading-4 text-zinc-300 custom-scrollbar">
        {file.textContent ? (
          <>{needsTruncation ? `${previewText}...` : file.textContent}</>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/55" />
      <p className="absolute bottom-2 left-2 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
        {fileExtension}
      </p>
      {file.uploadStatus === "uploading" && (
        <Loader2 className="absolute left-2 top-2 h-3.5 w-3.5 animate-spin text-amber-300" />
      )}
      {file.uploadStatus === "error" && (
        <AlertCircle className="absolute left-2 top-2 h-3.5 w-3.5 text-red-400" />
      )}
      <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {file.textContent && (
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6 p-0"
            onClick={() =>
              navigator.clipboard.writeText(file.textContent || "")
            }
            title="Copy content"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        <Button
          size="icon"
          variant="outline"
          className="h-6 w-6 p-0"
          onClick={() => onRemove(file.id)}
          title="Remove file"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

// Model Selector Component
const ModelSelectorDropdown: React.FC<{
  models: ModelOption[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}> = ({ models, selectedModel, onModelChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedModelData =
    models.find((m) => m.id === selectedModel) || models[0];
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        className="h-9 px-2.5 text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="max-w-[150px] truncate sm:max-w-[200px]">
          {selectedModelData.name}
        </span>
        <ChevronDown
          className={cn(
            "ml-1 h-4 w-4 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </Button>
      {isOpen && (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-72 rounded-2xl border border-white/8 bg-[#0A0E1A]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {models.map((model) => (
            <button
              key={model.id}
              className={cn(
                "flex w-full items-center justify-between rounded-xl p-2.5 text-left transition-colors hover:bg-white/5",
                model.id === selectedModel && "bg-white/5",
              )}
              onClick={() => {
                onModelChange(model.id);
                setIsOpen(false);
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-100">
                    {model.name}
                  </span>
                  {model.badge && (
                    <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-xs text-amber-300">
                      {model.badge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {model.description}
                </p>
              </div>
              {model.id === selectedModel && (
                <Check className="h-4 w-4 flex-shrink-0 text-amber-300" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Main ChatInput Component
export const ClaudeChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "How can I help you today?",
  maxFiles = MAX_FILES,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFileTypes,
  models = DEFAULT_MODELS_INTERNAL,
  defaultModel,
  onModelChange,
}) => {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [pastedContent, setPastedContent] = useState<PastedContent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    defaultModel || models[0]?.id || "",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedModel(defaultModel || models[0]?.id || "");
  }, [defaultModel, models]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    const maxHeight =
      Number.parseInt(getComputedStyle(textareaRef.current).maxHeight, 10) ||
      120;
    textareaRef.current.style.height = `${Math.min(
      textareaRef.current.scrollHeight,
      maxHeight,
    )}px`;
  }, [message]);

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const currentFileCount = files.length;
      if (currentFileCount >= maxFiles) {
        alert(
          `Maximum ${maxFiles} files allowed. Please remove some files to add new ones.`,
        );
        return;
      }

      const availableSlots = maxFiles - currentFileCount;
      const filesToAdd = Array.from(selectedFiles).slice(0, availableSlots);

      if (selectedFiles.length > availableSlots) {
        alert(
          `You can only add ${availableSlots} more file(s). ${selectedFiles.length - availableSlots} file(s) were not added.`,
        );
      }

      const newFiles = await Promise.all(
        filesToAdd
          .filter((file) => {
            if (file.size > maxFileSize) {
              alert(
                `File ${file.name} is too large. Maximum size is ${formatFileSize(maxFileSize)}.`,
              );
              return false;
            }
            return true;
          })
          .map(async (file) => {
            const fileWithPreview: FileWithPreview = {
              id: createId(),
              file,
              type: file.type || "application/octet-stream",
              uploadStatus: "pending",
            };

            if (file.type.startsWith("image/")) {
              fileWithPreview.preview = URL.createObjectURL(file);
            }

            if (isTextualFile(file)) {
              try {
                fileWithPreview.textContent = await readFileAsText(file);
              } catch {
                fileWithPreview.textContent = "Error reading file content";
              }
            }

            return fileWithPreview;
          }),
      );

      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxFiles, maxFileSize],
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) URL.revokeObjectURL(fileToRemove.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleSend = useCallback(() => {
    if (
      disabled ||
      (!message.trim() && files.length === 0 && pastedContent.length === 0)
    )
      return;
    if (files.some((f) => f.uploadStatus === "uploading")) {
      alert("Please wait for all files to finish uploading.");
      return;
    }
    onSendMessage?.(message, files, pastedContent);
    setMessage("");
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
    setPastedContent([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [disabled, files, message, onSendMessage, pastedContent]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const clipboardData = event.clipboardData;
      const items = clipboardData.items;

      const fileItems = Array.from(items).filter((i) => i.kind === "file");
      if (fileItems.length > 0 && files.length < maxFiles) {
        event.preventDefault();
        const pastedFiles = fileItems
          .map((i) => i.getAsFile())
          .filter(Boolean) as File[];
        const dataTransfer = new DataTransfer();
        pastedFiles.forEach((f) => dataTransfer.items.add(f));
        handleFileSelect(dataTransfer.files);
        return;
      }

      const textData = clipboardData.getData("text");
      if (
        textData &&
        textData.length > PASTE_THRESHOLD &&
        pastedContent.length < 5
      ) {
        event.preventDefault();
        setMessage(
          (current) => `${current}${textData.slice(0, PASTE_THRESHOLD)}...`,
        );
        setPastedContent((prev) => [
          ...prev,
          {
            id: createId(),
            content: textData,
            timestamp: new Date(),
            wordCount: textData.split(/\s+/).filter(Boolean).length,
          },
        ]);
      }
    },
    [files.length, handleFileSelect, maxFiles, pastedContent.length],
  );

  const canSend =
    (message.trim().length > 0 ||
      files.length > 0 ||
      pastedContent.length > 0) &&
    !disabled &&
    !files.some((f) => f.uploadStatus === "uploading");

  return (
    <div
      className={cn(
        "relative w-full rounded-[1.5rem] border border-white/8 bg-[#0A0E1A]/80 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all sm:p-4",
        isDragging && "border-amber-400/40 bg-amber-400/[0.04]",
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragging(false);
        await handleFileSelect(e.dataTransfer.files);
      }}
    >
      {(files.length > 0 || pastedContent.length > 0) && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
          {pastedContent.map((c) => (
            <PastedContentCard
              key={c.id}
              content={c}
              onRemove={(id) =>
                setPastedContent((prev) => prev.filter((pc) => pc.id !== id))
              }
            />
          ))}
          {files.map((f) => (
            <FilePreviewCard key={f.id} file={f} onRemove={removeFile} />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing &&
              !disabled
            ) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="max-h-[150px] w-full resize-none border-none bg-transparent text-zinc-100 shadow-none placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={acceptedFileTypes?.join(",")}
              onChange={(e) => {
                handleFileSelect(e.target.files);
                e.target.value = "";
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || files.length >= maxFiles}
              title={
                files.length >= maxFiles
                  ? `Max ${maxFiles} files reached`
                  : "Attach files"
              }
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
              disabled={disabled}
              title="Options"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {models.length > 0 && (
              <ModelSelectorDropdown
                models={models}
                selectedModel={selectedModel}
                onModelChange={(id) => {
                  setSelectedModel(id);
                  onModelChange?.(id);
                }}
              />
            )}
            <Button
              size="icon"
              className={cn(
                "h-9 w-9 flex-shrink-0 rounded-xl p-0 transition-colors",
                canSend
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "bg-white/5 text-zinc-500 cursor-not-allowed",
              )}
              onClick={handleSend}
              disabled={!canSend}
              title="Send message"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
