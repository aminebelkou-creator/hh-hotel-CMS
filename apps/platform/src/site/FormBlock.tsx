'use client'
import React, { useState } from 'react'
import type { SnapshotForm } from '@/releases/snapshot'

type Labels = { send: string; sending: string; sent: string; sendFailed: string; required: string }

/**
 * A hotel's contact form, rendered from the release snapshot and posted as JSON to the
 * platform's contact endpoint (the one API path open on a hotel's own domain).
 * Two bot checks travel with it: a hidden field no person fills, and the time the form was
 * opened; the server drops both before storing.
 */
export function FormBlock({ form, t }: { form: SnapshotForm; t: Labels }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const [opened] = useState(() => Date.now())

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setState('sending')
    const fd = new FormData(e.currentTarget)
    const submissionData = [...fd.entries()].map(([field, value]) => ({ field, value: String(value) }))
    submissionData.push({ field: '_t', value: String(opened) })
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ form: form.id, submissionData }),
      })
      if (!res.ok) throw new Error(String(res.status))
      if (form.confirmationType === 'redirect' && form.redirectUrl) {
        window.location.href = form.redirectUrl
        return
      }
      setState('sent')
    } catch {
      setState('failed')
    }
  }

  if (state === 'sent') {
    return (
      <p className="hh-form-done" role="status">
        {t.sent}
      </p>
    )
  }
  return (
    <form className="hh-form" onSubmit={onSubmit} noValidate={false}>
      {form.fields.map((f, i) => {
        const id = `f-${form.id}-${f.name || i}`
        const label = (
          <label htmlFor={id}>
            {f.label || f.name}
            {f.required ? <span aria-hidden="true"> *</span> : null}
          </label>
        )
        const width = f.width && f.width < 100 ? { flexBasis: `calc(${f.width}% - 8px)` } : undefined
        switch (f.blockType) {
          case 'text':
          case 'email':
          case 'number':
            return (
              <div key={id} className="hh-form-field" style={width}>
                {label}
                <input id={id} name={f.name} type={f.blockType === 'text' ? 'text' : f.blockType} required={!!f.required} defaultValue={(f.defaultValue as string) ?? ''} autoComplete={f.blockType === 'email' ? 'email' : undefined} />
              </div>
            )
          case 'textarea':
            return (
              <div key={id} className="hh-form-field" style={width}>
                {label}
                <textarea id={id} name={f.name} rows={5} required={!!f.required} defaultValue={(f.defaultValue as string) ?? ''} />
              </div>
            )
          case 'select':
            return (
              <div key={id} className="hh-form-field" style={width}>
                {label}
                <select id={id} name={f.name} required={!!f.required} defaultValue={(f.defaultValue as string) ?? ''}>
                  <option value="">—</option>
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          case 'checkbox':
            return (
              <div key={id} className="hh-form-field hh-form-field--check" style={width}>
                <input id={id} name={f.name} type="checkbox" required={!!f.required} defaultChecked={!!f.defaultValue} value="true" />
                {label}
              </div>
            )
          default:
            return null
        }
      })}
      <div className="hh-form-hp" aria-hidden="true">
        <label htmlFor={`hp-${form.id}`}>Leave this field empty</label>
        <input id={`hp-${form.id}`} name="_hp" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="hh-small">* {t.required}</p>
      {state === 'failed' && (
        <p className="hh-form-error" role="alert">
          {t.sendFailed}
        </p>
      )}
      <button className="hh-btn" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? t.sending : form.submitButtonLabel || t.send}
      </button>
    </form>
  )
}
