'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Bold, Italic, Underline, Strikethrough, Link2, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Code2, Palette, Type,
  Minus, Image, RotateCcw, Eye, Code,
} from 'lucide-react'

const SIGNATURE_HTML = `
<br/><br/>
<table style="border-top:2px solid #e85d04;padding-top:10px;margin-top:8px;font-family:Arial,sans-serif;font-size:13px;color:#374151;width:100%;max-width:480px;">
  <tr>
    <td>
      <strong style="font-size:15px;color:#111827;">م. مالك الطبجي &nbsp;|&nbsp; Eng. Malik Altubji</strong><br/>
      <span style="color:#e85d04;font-weight:600;">Crate.ae</span>
      <span style="color:#6b7280;"> — UAE Smart Trade Platform</span><br/><br/>
      <span>📞 <a href="tel:+971543000415" style="color:#374151;text-decoration:none;">+971 54 300 0415</a></span>&nbsp;&nbsp;
      <span>✉️ <a href="mailto:uae@crate.ae" style="color:#e85d04;text-decoration:none;">uae@crate.ae</a></span>&nbsp;&nbsp;
      <span>🌐 <a href="https://www.crate.ae" style="color:#374151;text-decoration:none;">www.crate.ae</a></span>
    </td>
  </tr>
</table>`

interface Props {
  value: string
  onChange: (v: string) => void
  isAr?: boolean
  placeholder?: string
}

export default function RichEmailEditor({ value, onChange, isAr, placeholder }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<'visual' | 'html'>('visual')
  const [htmlVal, setHtmlVal] = useState(value)
  const [sigInserted, setSigInserted] = useState(false)

  // Sync external value → editor on first load or mode switch
  useEffect(() => {
    if (mode === 'visual' && editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value
      }
    }
  }, [mode, value])

  // Auto-insert signature once when editor first gets content
  const insertSig = useCallback(() => {
    if (sigInserted) return
    const html = editorRef.current?.innerHTML ?? ''
    const next = html + SIGNATURE_HTML
    if (editorRef.current) editorRef.current.innerHTML = next
    onChange(next)
    setSigInserted(true)
  }, [sigInserted, onChange])

  function handleInput() {
    const html = editorRef.current?.innerHTML ?? ''
    onChange(html)
    setHtmlVal(html)
  }

  function switchToHtml() {
    setHtmlVal(editorRef.current?.innerHTML ?? value)
    setMode('html')
  }

  function switchToVisual() {
    setMode('visual')
    // innerHTML set by useEffect
  }

  function exec(cmd: string, val?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    handleInput()
  }

  function insertLink() {
    const url = prompt(isAr ? 'أدخل الرابط:' : 'Enter URL:', 'https://')
    if (url) exec('createLink', url)
  }

  function insertImage() {
    const url = prompt(isAr ? 'رابط الصورة:' : 'Image URL:', 'https://')
    if (url) exec('insertImage', url)
  }

  function insertHr() {
    exec('insertHTML', '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"/>')
  }

  function setColor() {
    const c = prompt(isAr ? 'لون النص (hex):' : 'Text color (hex):', '#e85d04')
    if (c) exec('foreColor', c)
  }

  function addSignature() {
    if (editorRef.current) {
      editorRef.current.innerHTML += SIGNATURE_HTML
      onChange(editorRef.current.innerHTML)
      setHtmlVal(editorRef.current.innerHTML)
      setSigInserted(true)
    }
  }

  const TB = 'w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors'
  const SEP = <div className="w-px h-5 bg-slate-200 mx-0.5" />

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* ── Toolbar ── */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50">

        {/* Mode toggle */}
        <div className="flex items-center rounded-lg overflow-hidden border border-slate-200 me-2">
          <button onClick={switchToVisual}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold transition-colors ${mode === 'visual' ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
            <Eye className="w-3 h-3" />{isAr ? 'مرئي' : 'Visual'}
          </button>
          <button onClick={switchToHtml}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold transition-colors ${mode === 'html' ? 'bg-violet-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
            <Code className="w-3 h-3" />HTML
          </button>
        </div>

        {mode === 'visual' && <>
          {/* Text style */}
          <select onChange={e => exec('formatBlock', e.target.value)} defaultValue=""
            className="text-[10px] border border-slate-200 rounded px-1 py-0.5 text-slate-600 bg-white me-1 focus:outline-none">
            <option value="" disabled>{isAr ? 'نمط' : 'Style'}</option>
            <option value="p">{isAr ? 'نص عادي' : 'Paragraph'}</option>
            <option value="h1">H1</option>
            <option value="h2">H2</option>
            <option value="h3">H3</option>
            <option value="blockquote">{isAr ? 'اقتباس' : 'Quote'}</option>
          </select>

          {SEP}
          <button onClick={() => exec('bold')} className={TB} title="Bold"><Bold className="w-3.5 h-3.5" /></button>
          <button onClick={() => exec('italic')} className={TB} title="Italic"><Italic className="w-3.5 h-3.5" /></button>
          <button onClick={() => exec('underline')} className={TB} title="Underline"><Underline className="w-3.5 h-3.5" /></button>
          <button onClick={() => exec('strikeThrough')} className={TB} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></button>

          {SEP}
          <button onClick={() => exec('justifyLeft')} className={TB} title="Align left"><AlignLeft className="w-3.5 h-3.5" /></button>
          <button onClick={() => exec('justifyCenter')} className={TB} title="Center"><AlignCenter className="w-3.5 h-3.5" /></button>
          <button onClick={() => exec('justifyRight')} className={TB} title="Align right"><AlignRight className="w-3.5 h-3.5" /></button>

          {SEP}
          <button onClick={() => exec('insertUnorderedList')} className={TB} title="Bullet list"><List className="w-3.5 h-3.5" /></button>
          <button onClick={() => exec('insertOrderedList')} className={TB} title="Numbered list"><ListOrdered className="w-3.5 h-3.5" /></button>

          {SEP}
          <button onClick={insertLink} className={TB} title="Insert link"><Link2 className="w-3.5 h-3.5" /></button>
          <button onClick={insertImage} className={TB} title="Insert image"><Image className="w-3.5 h-3.5" /></button>
          <button onClick={insertHr} className={TB} title="Divider"><Minus className="w-3.5 h-3.5" /></button>
          <button onClick={setColor} className={TB} title="Text color"><Palette className="w-3.5 h-3.5" /></button>

          {SEP}
          <button onClick={() => exec('removeFormat')} className={TB} title="Clear formatting"><RotateCcw className="w-3.5 h-3.5" /></button>

          {SEP}
          {/* Tokens */}
          <button onClick={() => exec('insertHTML', '{{name}}')}
            className="text-[9px] px-2 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-700 font-mono font-bold hover:bg-violet-100">
            {'{{name}}'}
          </button>
          <button onClick={() => exec('insertHTML', '{{company}}')}
            className="text-[9px] px-2 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-700 font-mono font-bold hover:bg-violet-100 ms-0.5">
            {'{{company}}'}
          </button>

          {SEP}
          {/* Auto-signature */}
          <button onClick={addSignature}
            className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded border border-orange-200 bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 ms-0.5">
            <Type className="w-3 h-3" />{isAr ? 'توقيع' : 'Signature'}
          </button>
        </>}
      </div>

      {/* ── Visual editor ── */}
      {mode === 'visual' && (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={() => { if (!sigInserted && !value.includes('crate.ae')) insertSig() }}
          dir={isAr ? 'rtl' : 'ltr'}
          className="min-h-[220px] max-h-[420px] overflow-y-auto px-4 py-3 text-sm text-slate-800 focus:outline-none leading-relaxed"
          style={{ fontFamily: 'Arial, sans-serif' }}
          data-placeholder={placeholder ?? (isAr ? 'اكتب محتوى الإيميل هنا…' : 'Write email content here…')}
        />
      )}

      {/* ── HTML editor ── */}
      {mode === 'html' && (
        <textarea
          value={htmlVal}
          onChange={e => { setHtmlVal(e.target.value); onChange(e.target.value) }}
          rows={12}
          dir="ltr"
          className="w-full px-4 py-3 text-[11px] font-mono text-slate-700 focus:outline-none resize-none"
          placeholder="<p>HTML here…</p>"
        />
      )}

      {/* Placeholder CSS */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
