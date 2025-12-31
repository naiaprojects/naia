'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';

export default function TiptapEditor({ content, onChange }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
            Image,
        ],
        content: content || '',
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] p-4',
            },
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content || '');
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    const addImage = () => {
        const url = window.prompt('Masukkan URL gambar:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setLink = () => {
        const url = window.prompt('Masukkan URL:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    return (
        <div className="border border-slate-300 rounded-lg overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-300 p-2 flex flex-wrap gap-1">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('bold') ? 'bg-slate-300' : 'bg-white'}`}
                    title="Bold"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('italic') ? 'bg-slate-300' : 'bg-white'}`}
                    title="Italic"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('strike') ? 'bg-slate-300' : 'bg-white'}`}
                    title="Strikethrough"
                >
                    <s>S</s>
                </button>

                <div className="w-px bg-slate-300 mx-1"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-300' : 'bg-white'}`}
                    title="Heading 2"
                >
                    H2
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-300' : 'bg-white'}`}
                    title="Heading 3"
                >
                    H3
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setParagraph().run()}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('paragraph') ? 'bg-slate-300' : 'bg-white'}`}
                    title="Paragraph"
                >
                    P
                </button>

                <div className="w-px bg-slate-300 mx-1"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('bulletList') ? 'bg-slate-300' : 'bg-white'}`}
                    title="Bullet List"
                >
                    • List
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('orderedList') ? 'bg-slate-300' : 'bg-white'}`}
                    title="Numbered List"
                >
                    1. List
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('blockquote') ? 'bg-slate-300' : 'bg-white'}`}
                    title="Quote"
                >
                    " Quote
                </button>

                <div className="w-px bg-slate-300 mx-1"></div>

                <button
                    type="button"
                    onClick={setLink}
                    className={`px-3 py-1.5 rounded hover:bg-slate-200 transition-colors ${editor.isActive('link') ? 'bg-slate-300' : 'bg-white'}`}
                    title="Add Link"
                >
                    🔗 Link
                </button>
                <button
                    type="button"
                    onClick={addImage}
                    className="px-3 py-1.5 rounded bg-white hover:bg-slate-200 transition-colors"
                    title="Add Image"
                >
                    🖼️ Image
                </button>

                <div className="w-px bg-slate-300 mx-1"></div>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="px-3 py-1.5 rounded bg-white hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Undo"
                >
                    ↶ Undo
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="px-3 py-1.5 rounded bg-white hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Redo"
                >
                    ↷ Redo
                </button>
            </div>

            <EditorContent editor={editor} />
        </div>
    );
}
