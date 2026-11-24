import { useEffect, useRef } from "react";
import { EditorContent, useEditor, useEditorState, type JSONContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { NOTE_LIMIT, type Task } from "../types";
import { useTasks } from "../state/TaskContext";
import { HighlighterIcon } from "./Icons";

const SAVE_DELAY = 500;
const fmt = new Intl.NumberFormat("pt-BR");

interface Props {
  task: Task;
  autoFocus?: boolean;
}

export function NoteEditor({ task, autoFocus = false }: Props) {
  const { setNote } = useTasks();
  const setNoteRef = useRef(setNote);
  setNoteRef.current = setNote;

  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<{ doc: JSONContent; text: string } | null>(null);
  const flush = () => {
    window.clearTimeout(timer.current);
    if (pending.current) {
      setNoteRef.current(task.id, pending.current.doc, pending.current.text);
      pending.current = null;
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        code: false,
        horizontalRule: false,
        bold: false,
        italic: false,
        strike: false,
        underline: false,
        link: false,
      }),
      Highlight,
      CharacterCount.configure({ limit: NOTE_LIMIT }),
      Placeholder.configure({ placeholder: "escrever uma nota…" }),
    ],
    content: task.note?.doc ?? "",
    onUpdate: ({ editor }) => {
      pending.current = { doc: editor.getJSON(), text: editor.getText() };
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, SAVE_DELAY);
    },
    onBlur: flush,
  });

  useEffect(() => flush, []);

  const holder = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus && editor) {
      editor.commands.focus("end");
      holder.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [autoFocus, editor]);

  const chars = useEditorState({
    editor,
    selector: ({ editor }) => (editor ? editor.storage.characterCount.characters() : 0),
  });

  return (
    <div className="note" ref={holder}>
      <EditorContent editor={editor} className="note-content" />
      {editor && (
        <BubbleMenu editor={editor} className="bubble" shouldShow={({ state }) => !state.selection.empty}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            aria-label="Grifar (Ctrl+Shift+H)"
            title="Grifar (Ctrl+Shift+H)"
          >
            <HighlighterIcon />
          </button>
        </BubbleMenu>
      )}
      {(chars ?? 0) > NOTE_LIMIT * 0.8 && (
        <span className="note-count">
          {fmt.format(chars ?? 0)} / {fmt.format(NOTE_LIMIT)}
        </span>
      )}
    </div>
  );
}
