"use client";

import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { apiClient } from "@/lib/api-client";
import { makeErrorResponse } from "@/lib/http";

const schema = z.object({
  postUrl: z
    .string()
    .url("Enter a valid Instagram URL")
    .min(12, "Enter an Instagram URL"),
});

type FormValues = z.infer<typeof schema>;

type Item = {
  kind: "video" | "image";
  url: string;
  width?: number;
  height?: number;
  filename: string;
};

type ApiSuccess = {
  status: "success";
  data: { items: Item[] };
};

type ApiError = {
  status: "error";
  message: string;
};

async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

export function InstagramVideoForm() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [httpError, setHttpError] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { postUrl: "" },
    mode: "onSubmit",
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(values: FormValues) {
    setItems(null);
    setHttpError("");

    try {
      const res = (await apiClient.get(
        `/video?postUrl=${encodeURIComponent(values.postUrl)}`
      )) as ApiSuccess | ApiError;

      if ((res as ApiError).status === "error") {
        setHttpError((res as ApiError).message || "Something went wrong");
        return;
      }

      const ok = res as ApiSuccess;
      if (!ok.data?.items || ok.data.items.length === 0) {
        setHttpError("No downloadable media found");
        return;
      }

      setItems(ok.data.items);
    } catch (e: any) {
      const msg =
        e?.message ||
        (typeof e === "string" ? e : "Unable to fetch Instagram media");
      setHttpError(msg);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <Form {...form}>
        <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="mb-2 h-6 w-full px-2 text-start text-red-500">
            {httpError}
          </div>

          <div className="relative mb-6 flex w-full flex-col items-center gap-4 sm:flex-row">
            <FormField
              control={form.control}
              name="postUrl"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <Input
                      disabled={isPending}
                      type="url"
                      placeholder="Paste your Instagram link here..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="ml-2" />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isPending} className="min-w-40">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Get Media
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Results */}
      {items && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((m, i) => (
            <div
              key={`${m.kind}-${i}`}
              className="rounded-2xl border p-3 shadow-sm"
            >
              <div className="mb-3 text-sm text-muted-foreground">
                {m.kind.toUpperCase()} {m.width && m.height ? `• ${m.width}×${m.height}` : ""}
              </div>

              <div className="mb-3 overflow-hidden rounded-xl">
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={`ig-image-${i}`} className="h-auto w-full" />
                ) : (
                  <video className="h-auto w-full" controls src={m.url} />
                )}
              </div>

              <Button
                variant="default"
                onClick={() => downloadFile(m.url, m.filename)}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Download {m.kind === "image" ? "Image" : "Video"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
