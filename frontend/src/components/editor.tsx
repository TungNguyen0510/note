/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { en } from "@blocknote/core/locales";
import { createHighlighter } from "../../shiki.bundle";
import { useEffect, useMemo, useRef, useState } from "react";
import { Block } from "@blocknote/core";
import { getNoteById, getNoteContent, updateNote } from "@/lib/api";
import { Note, NoteWithContent } from "../../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function Editor() {
  const [note, setNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState<NoteWithContent | null>(null);
  const [hash, setHash] = useState<string>(
    typeof window === "undefined" ? "" : window.location.hash
  );
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [saveTimer, setSaveTimer] = useState<any>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const lastSavedDocStrRef = useRef<string>("");
  const noteId = useMemo(() => {
    const match = hash.match(/#note\/(.+)$/);
    return match ? match[1] : null;
  }, [hash]);

  const editor = useCreateBlockNote({
    dictionary: en,
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
      setShowPasswordPrompt(false);
      setPasswordError("");

      if (!noteId) {
        setNote(null);
        setNoteContent(null);
        editor.replaceBlocks(editor.document, []);
        setTimeout(() => setIsHydrating(false), 0);
        return;
      }

      try {
        const n = await getNoteById(noteId);
        if (cancelled) return;
        setNote(n);

        if (n.hasPassword) {
          setShowPasswordPrompt(true);
          setTimeout(() => setIsHydrating(false), 0);
          return;
        }

        const content = await getNoteContent(noteId, "");
        if (cancelled) return;
        setNoteContent(content);
      } catch (error) {
        console.error("Error loading note:", error);
        setPasswordError("Failed to load note");
      }

      setTimeout(() => setIsHydrating(false), 0);
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  const handlePasswordSubmit = async () => {
    if (!note?.id || !password) return;

    try {
      setPassword("");
      setPasswordError("");
      setIsHydrating(true);
      const content = await getNoteContent(note.id, password);
      setNoteContent(content);
      setShowPasswordPrompt(false);
      setTimeout(() => setIsHydrating(false), 0);
    } catch (error) {
      console.error("Password verification failed:", error);
      setPasswordError("Invalid password");
      setIsHydrating(false);
    }
  };

  useEffect(() => {
    if (!noteContent || isHydrating) return;

    const initial = normalizeBlocks(noteContent.json);
    if (typeof window !== "undefined") {
      console.debug("Updating editor with noteContent", {
        id: noteContent.id,
        json: noteContent.json,
        initialBlocks: initial,
      });
    }

    try {
      lastSavedDocStrRef.current = JSON.stringify(initial);
    } catch {
      lastSavedDocStrRef.current = "";
    }

    setTimeout(() => {
      editor.replaceBlocks(editor.document, initial);
    }, 100);
  }, [noteContent, isHydrating, editor]);

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

  if (showPasswordPrompt) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Enter Password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              This note is password protected
            </p>
          </div>
          <form
            className="mt-8 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handlePasswordSubmit();
            }}
          >
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="w-full"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && (
                <p className="mt-2 text-sm text-red-600">{passwordError}</p>
              )}
            </div>
            <div>
              <Button
                type="submit"
                className="group relative w-full cursor-pointer"
              >
                Unlock Note
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
