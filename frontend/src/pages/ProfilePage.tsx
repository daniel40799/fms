import { useEffect, useRef, useState } from 'react'
import { DatePickerInput } from '../components/forms'
import { Page } from '../components/layout'
import { Button, Field, InlineError, Panel, Select } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { backendUrl } from '../lib/backendPaths'
import type { Me, ProfilePayload } from '../types'

const mobileNumberMessage = 'Mobile number must be in 09XXXXXXXXX or +639XXXXXXXXX format.'
const philippineMobilePattern = /^(09\d{9}|\+639\d{9})$/
const maxProfileImageSize = 5 * 1024 * 1024

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0]
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]
  return [first, second].filter(Boolean).join('').toUpperCase() || 'U'
}

export function ProfilePage({
  me,
  onUpdate,
  onUploadPicture,
}: {
  me: Me
  onUpdate: (payload: ProfilePayload) => Promise<void>
  onUploadPicture: (file: File) => Promise<void>
}) {
  const [form, setForm] = useState({
    firstName: me.firstName ?? '',
    middleName: me.middleName ?? '',
    lastName: me.lastName ?? '',
    birthday: me.birthday ?? '',
    sex: me.sex ?? '',
    address: me.address ?? '',
    mobileNumber: me.mobileNumber ?? '',
    prcNumber: me.prcNumber ?? '',
  })
  const [mobileError, setMobileError] = useState('')
  const [selectedPicture, setSelectedPicture] = useState<File | null>(null)
  const [pictureError, setPictureError] = useState('')
  const [picturePreviewUrl, setPicturePreviewUrl] = useState('')
  const picturePreviewUrlRef = useRef('')
  const save = useAsyncAction(async () => onUpdate({
    firstName: form.firstName.trim(),
    middleName: form.middleName.trim() || null,
    lastName: form.lastName.trim(),
    birthday: form.birthday || null,
    sex: form.sex || null,
    address: form.address.trim() || null,
    mobileNumber: form.mobileNumber.trim() || null,
    prcNumber: form.prcNumber.trim() || null,
  }))
  const uploadPicture = useAsyncAction(async () => {
    if (!selectedPicture) {
      throw new Error('Choose an image before saving.')
    }

    await onUploadPicture(selectedPicture)
    setSelectedPicture(null)
    setPicturePreview(null)
  })
  const set = <Key extends keyof typeof form>(key: Key, value: (typeof form)[Key]) =>
    setForm((current) => ({ ...current, [key]: value }))
  const profileImageUrl = picturePreviewUrl || backendUrl(me.profileImageUrl)

  useEffect(() => () => {
    if (picturePreviewUrlRef.current) {
      URL.revokeObjectURL(picturePreviewUrlRef.current)
    }
  }, [])

  function setPicturePreview(file: File | null) {
    if (picturePreviewUrlRef.current) {
      URL.revokeObjectURL(picturePreviewUrlRef.current)
    }

    const nextPreviewUrl = file ? URL.createObjectURL(file) : ''
    picturePreviewUrlRef.current = nextPreviewUrl
    setPicturePreviewUrl(nextPreviewUrl)
  }

  function handlePictureChange(file: File | null) {
    uploadPicture.setError('')

    if (!file) {
      setSelectedPicture(null)
      setPicturePreview(null)
      setPictureError('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setSelectedPicture(null)
      setPicturePreview(null)
      setPictureError('Choose an image file.')
      return
    }

    if (file.size > maxProfileImageSize) {
      setSelectedPicture(null)
      setPicturePreview(null)
      setPictureError('Profile picture must be 5 MB or smaller.')
      return
    }

    setPictureError('')
    setSelectedPicture(file)
    setPicturePreview(file)
  }

  return (
    <Page
      title="Profile"
      description="Maintain the participant identity used for event registration and activity records."
    >
      <div className="space-y-6">
        <Panel title="Profile picture">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border border-slate-200 bg-sky-50 text-2xl font-black text-sky-800 shadow-sm ring-4 ring-sky-100/70 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100 dark:ring-sky-400/10">
              {profileImageUrl ? (
                <img className="h-full w-full object-cover" src={profileImageUrl} alt={`${me.fullName} profile`} />
              ) : (
                getInitials(me.fullName)
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <label
                  className="inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 ease-out hover:border-slate-400 hover:bg-slate-50 hover:shadow-md focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sky-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-white/10 dark:focus-within:outline-sky-400 motion-reduce:transition-none"
                >
                  {me.profileImageUrl ? 'Change Profile Picture' : 'Add Profile Picture'}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handlePictureChange(event.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
              {selectedPicture ? (
                <p className="break-words text-sm text-slate-600 dark:text-slate-300">{selectedPicture.name}</p>
              ) : null}
              {(pictureError || uploadPicture.error) && <InlineError message={pictureError || uploadPicture.error} />}
              <Button
                type="button"
                variant="secondary"
                loading={uploadPicture.loading}
                disabled={!selectedPicture}
                onClick={() => void uploadPicture.run()}
              >
                {uploadPicture.loading ? 'Saving...' : 'Save picture'}
              </Button>
            </div>
          </div>
        </Panel>
        <Panel title="Personal information">
          {save.error && <InlineError message={save.error} />}
          <form
            className="grid max-w-4xl gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              const mobileNumber = form.mobileNumber.trim()
              if (mobileNumber && !philippineMobilePattern.test(mobileNumber)) {
                setMobileError(mobileNumberMessage)
                return
              }
              setMobileError('')
              void save.run()
            }}
          >
            <Field label="First name">
              <input className="input" value={form.firstName} onChange={(event) => set('firstName', event.target.value)} required />
            </Field>
            <Field label="Middle name">
              <input className="input" value={form.middleName} onChange={(event) => set('middleName', event.target.value)} />
            </Field>
            <Field label="Last name">
              <input className="input" value={form.lastName} onChange={(event) => set('lastName', event.target.value)} required />
            </Field>
            <Field label="Birthday">
              <DatePickerInput value={form.birthday} onChange={(value) => set('birthday', value)} maxDate={new Date()} />
            </Field>
            <Field label="Gender">
              <Select value={form.sex} onChange={(event) => set('sex', event.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </Select>
            </Field>
            <Field label="Mobile number" error={mobileError}>
              <input
                className="input"
                type="tel"
                inputMode="tel"
                pattern="(09[0-9]{9}|\+639[0-9]{9})"
                title={mobileNumberMessage}
                aria-invalid={mobileError ? 'true' : undefined}
                value={form.mobileNumber}
                onChange={(event) => {
                  set('mobileNumber', event.target.value)
                  if (mobileError) setMobileError('')
                }}
              />
            </Field>
            <Field label="PRC number">
              <input
                className="input"
                inputMode="numeric"
                maxLength={7}
                pattern="\d{7}"
                title="Enter a 7-digit PRC number."
                value={form.prcNumber}
                onChange={(event) => set('prcNumber', event.target.value)}
              />
            </Field>
            <Field label="Address" className="sm:col-span-2">
              <textarea className="input min-h-24" value={form.address} onChange={(event) => set('address', event.target.value)} />
            </Field>
            <Field label="Email">
              <input className="input bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400" value={me.email} readOnly />
            </Field>
            <Field label="Organization">
              <input className="input bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400" value={me.organization ?? 'None'} readOnly />
            </Field>
            <div className="flex items-end sm:col-span-2">
              <Button loading={save.loading}>{save.loading ? 'Saving...' : 'Save profile'}</Button>
            </div>
          </form>
        </Panel>
      </div>
    </Page>
  )
}
