"use client";

import React, { useState, useRef, useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import Label from './Label';
import MediaLibrary from '../common/MediaLibrary';
import BlotFormatter from 'quill-blot-formatter';
import Quill from 'quill';
import { Modal } from '../ui/modal';

// @ts-ignore
if (Quill && !Quill.imports['modules/blotFormatter']) {
    Quill.register('modules/blotFormatter', BlotFormatter);
}

// Custom styles to prevent editor content from overflowing
const quillStyles = `
  .ql-container {
    height: 200px !important;
    font-size: 16px;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    background: #ffffff;
  }
  .ql-editor {
    height: 100%;
    max-width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  .ql-editor img, .ql-editor iframe, .ql-editor video {
    max-width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
  }
  .ql-toolbar {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    background: #f9fafb;
  }
  /* Fix for global SVG styles stretching Quill toolbar icons */
  .quill svg {
    display: inline !important;
    width: 18px !important;
    height: 18px !important;
  }
  .quill .ql-picker-label svg {
    display: inline !important;
    width: 18px !important;
    height: 18px !important;
  }
`;

export interface RichTextEditorProps {
    label?: string;  // Optional — not all usages need a visible label
    value: string;
    onChange: (content: string) => void;
}

export default function RichTextEditor({ label, value, onChange }: RichTextEditorProps) {
    const quillRef = useRef<ReactQuill>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    // Link modal states
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isLinkMediaModalOpen, setIsLinkMediaModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [selectedText, setSelectedText] = useState('');
    const [savedRange, setSavedRange] = useState<any>(null);

    const imageHandler = useCallback(() => {
        setIsMediaModalOpen(true);
    }, []);

    const linkHandler = useCallback(() => {
        const editor = (quillRef.current as any)?.getEditor();
        if (editor) {
            const range = editor.getSelection();
            if (range) {
                // Get currently selected text
                const text = editor.getText(range.index, range.length);
                
                // Get existing formats to check for a link
                const formats = editor.getFormat(range.index, range.length);
                const currentLink = formats?.link || '';

                setSelectedText(text);
                setLinkUrl(currentLink);
                setSavedRange(range);
                setIsLinkModalOpen(true);
            }
        }
    }, []);

    const modules = useMemo(() => ({
        blotFormatter: {},
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['link', 'image', 'video', 'clean']
            ],
            handlers: {
                image: imageHandler,
                link: linkHandler
            }
        }
    }), [imageHandler, linkHandler]);

    const formats = [
        'header', 'bold', 'italic', 'underline', 'strike',
        'blockquote', 'list', 'align', 'link', 'image', 'video'
    ];

    const handleMediaSelect = (url: string) => {
        setIsMediaModalOpen(false);
        const editor = (quillRef.current as any)?.getEditor();
        if (editor) {
            const range = editor.getSelection(true);
            editor.insertEmbed(range.index, 'image', url);
            editor.setSelection(range.index + 1, 0); // Move cursor right after the embedded image
        }
    };

    const handleLinkMediaSelect = (url: string) => {
        setLinkUrl(url);
        setIsLinkMediaModalOpen(false);
        setIsLinkModalOpen(true); // Re-open link modal
    };

    const handleSaveLink = () => {
        const editor = (quillRef.current as any)?.getEditor();
        if (editor && savedRange) {
            editor.focus();
            
            // Check if we are adding or updating a link
            if (linkUrl.trim() === '') {
                // Remove link format
                editor.formatText(savedRange.index, savedRange.length, 'link', false);
            } else {
                const textToUse = selectedText.trim() || 'Link';
                
                if (savedRange.length > 0) {
                    // Update text if changed, then format it
                    const currentText = editor.getText(savedRange.index, savedRange.length);
                    if (textToUse !== currentText) {
                        editor.deleteText(savedRange.index, savedRange.length);
                        editor.insertText(savedRange.index, textToUse, 'link', linkUrl);
                    } else {
                        editor.formatText(savedRange.index, savedRange.length, 'link', linkUrl);
                    }
                } else {
                    // Just insert new link text at cursor
                    editor.insertText(savedRange.index, textToUse, 'link', linkUrl);
                }
            }
            setIsLinkModalOpen(false);
        }
    };

    const normalizeHtml = useCallback((html: string) => {
        if (!html) return '';
        return html
            .replace(/&nbsp;/g, ' ')
            .replace(/\u00a0/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
    }, []);

    const lastValueRef = useRef(value);

    // Sync external changes (e.g. database load, seed) into the editor
    React.useEffect(() => {
        const editor = quillRef.current?.getEditor();
        if (editor) {
            const currentHtml = editor.root.innerHTML;
            if (normalizeHtml(value) !== normalizeHtml(currentHtml) && normalizeHtml(value) !== normalizeHtml(lastValueRef.current)) {
                const range = editor.getSelection();
                editor.clipboard.dangerouslyPasteHTML(value || '');
                lastValueRef.current = value;
                if (range) {
                    setTimeout(() => {
                        editor.setSelection(range.index, range.length);
                    }, 0);
                }
            }
        }
    }, [value, normalizeHtml]);

    const handleEditorChange = useCallback((content: string) => {
        lastValueRef.current = content;
        if (normalizeHtml(content) !== normalizeHtml(value)) {
            onChange(content);
        }
    }, [onChange, value, normalizeHtml]);

    return (
        <div className="flex flex-col gap-2 relative max-w-full">
            <style dangerouslySetInnerHTML={{ __html: quillStyles }} />
            {label && <Label>{label}</Label>}
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 shadow-sm max-w-full">
                <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    defaultValue={value}
                    onChange={handleEditorChange}
                    modules={modules}
                    formats={formats}
                    className="text-gray-900 dark:text-gray-100 max-w-full" 
                />
            </div>

            <MediaLibrary 
                isOpen={isMediaModalOpen} 
                onClose={() => setIsMediaModalOpen(false)} 
                onSelect={handleMediaSelect} 
            />

            <MediaLibrary 
                isOpen={isLinkMediaModalOpen} 
                onClose={() => {
                    setIsLinkMediaModalOpen(false);
                    setIsLinkModalOpen(true);
                }} 
                onSelect={handleLinkMediaSelect} 
            />

            <Modal
                isOpen={isLinkModalOpen}
                onClose={() => setIsLinkModalOpen(false)}
                title="Insert / Edit Link"
                size="sm"
            >
                <div className="flex flex-col gap-4 text-gray-800 dark:text-white">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold">Text to display</label>
                        <input
                            type="text"
                            value={selectedText}
                            onChange={(e) => setSelectedText(e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold">Link URL</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com or select a file"
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    setIsLinkModalOpen(false);
                                    setIsLinkMediaModalOpen(true);
                                }}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium transition-colors"
                            >
                                Choose File
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsLinkModalOpen(false)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveLink}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                        >
                            Save Link
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
