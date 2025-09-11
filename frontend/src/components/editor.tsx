/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { vi } from "@blocknote/core/locales";
import { createHighlighter } from "../../shiki.bundle";
import { useEffect, useMemo, useRef, useState } from "react";
import { Block } from "@blocknote/core";
import { getNoteById, updateNote } from "@/lib/api";
import { Note } from "../../types";

export default function Editor() {
  const [note, setNote] = useState<Note | null>(null);
  const [hash, setHash] = useState<string>(
    typeof window === "undefined" ? "" : window.location.hash
  );
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [saveTimer, setSaveTimer] = useState<any>(null);
  const lastSavedDocStrRef = useRef<string>("");
  const noteId = useMemo(() => {
    const match = hash.match(/#note\/(.+)$/);
    return match ? match[1] : null;
  }, [hash]);

  const editor = useCreateBlockNote({
    dictionary: vi,
    codeBlock: {
      indentLineWithTab: true,
      defaultLanguage: "typescript",
      supportedLanguages: {
        typescript: {
          name: "Typescript",
          aliases: ["ts"],
        },
        javascript: {
          name: "Javascript",
          aliases: ["js"],
        },
        vue: {
          name: "Vue",
          aliases: ["vue"],
        },
      },
      createHighlighter: () =>
        createHighlighter({
          themes: ["dark-plus", "light-plus"],
          langs: [],
        }),
    },
  });

  function normalizeBlocks(json: any): Block[] {
    if (!json) return [];
    let data = json;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        return [
          {
            id: undefined as any,
            type: "paragraph" as any,
            content: [
              {
                type: "text" as any,
                text: data,
              },
            ],
          } as unknown as Block,
        ];
      }
    }
    if (Array.isArray(data)) return data as Block[];
    if (Array.isArray((data as any).blocks))
      return (data as any).blocks as Block[];
    if (Array.isArray((data as any).document))
      return (data as any).document as Block[];
    if (Array.isArray((data as any).content))
      return (data as any).content as Block[];
    if (data && typeof data === "object") {
      for (const key of Object.keys(data)) {
        const val = (data as any)[key];
        if (
          Array.isArray(val) &&
          val.length > 0 &&
          typeof val[0] === "object" &&
          ("type" in val[0] || "id" in val[0])
        ) {
          return val as Block[];
        }
      }
    }
    return [];
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsHydrating(true);
      if (!noteId) {
        setNote(null);
        editor.replaceBlocks(editor.document, []);
        setTimeout(() => setIsHydrating(false), 0);
        return;
      }
      const n = await getNoteById(noteId);
      if (cancelled) return;
      setNote(n);
      const initial = normalizeBlocks(n.json);
      if (typeof window !== "undefined") {
        console.debug("Note loaded", {
          id: n.id,
          json: n.json,
          initialBlocks: initial,
        });
      }
      try {
        lastSavedDocStrRef.current = JSON.stringify(initial);
      } catch {
        lastSavedDocStrRef.current = "";
      }
      editor.replaceBlocks(editor.document, initial);
      setTimeout(() => setIsHydrating(false), 0);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  useEffect(() => {
    function onHashChange() {
      setHash(window.location.hash);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", onHashChange);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("hashchange", onHashChange);
      }
    };
  }, []);

  return (
    <BlockNoteView
      editor={editor}
      onChange={() => {
        if (!note?.id) return;
        if (isHydrating) return;
        let currentStr = "";
        try {
          currentStr = JSON.stringify(editor.document);
        } catch {
          return;
        }
        if (currentStr === lastSavedDocStrRef.current) return;
        if (saveTimer) clearTimeout(saveTimer);
        const timer = setTimeout(async () => {
          try {
            await updateNote(note.id, { json: { blocks: editor.document } });
            lastSavedDocStrRef.current = currentStr;
          } catch (e) {
            console.error(e);
          }
        }, 800);
        setSaveTimer(timer);
      }}
    />
  );
}
