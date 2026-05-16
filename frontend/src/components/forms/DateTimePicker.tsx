import { isValid } from 'date-fns'
import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

const closeAnimationMs = 120

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isPickerElement(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(
      target.closest(
        '.react-datepicker, .react-datepicker-popper, .react-datepicker__month-select, .react-datepicker__year-select, .react-datepicker__time-container',
      ),
    )
  )
}

export function DateTimePicker({
  value,
  onChange,
  required,
  placeholder = 'Select date and time',
}: {
  value: Date | null
  onChange: (value: Date | null) => void
  required?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current)
      }
    }
  }, [])

  function openPicker() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setIsClosing(false)
    setOpen(true)
  }

  function closePicker() {
    if (!open && !isClosing) return

    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }

    if (prefersReducedMotion()) {
      setIsClosing(false)
      setOpen(false)
      return
    }

    setIsClosing(true)
    closeTimer.current = window.setTimeout(() => {
      setOpen(false)
      setIsClosing(false)
      closeTimer.current = null
    }, closeAnimationMs)
  }

  function handleChange(nextValue: Date | null, event?: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) {
    onChange(nextValue)

    const target = event?.target
    const changedTime = target instanceof HTMLElement && Boolean(target.closest('.react-datepicker__time-list-item'))
    if (nextValue && isValid(nextValue) && changedTime) {
      requestAnimationFrame(() => {
        closePicker()
      })
      return
    }

    if (!nextValue) {
      requestAnimationFrame(() => {
        closePicker()
      })
    }
  }

  return (
    <div
      ref={wrapperRef}
      onBlur={(event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget) && !isPickerElement(event.relatedTarget)) {
          closePicker()
        }
      }}
    >
      <DatePicker
        selected={value}
        onChange={handleChange}
        open={open}
        onInputClick={openPicker}
        onFocus={openPicker}
        onClickOutside={closePicker}
        onCalendarClose={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') closePicker()
        }}
        popperPlacement="bottom-start"
        showTimeSelect
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        shouldCloseOnSelect={false}
        timeIntervals={15}
        isClearable={!required}
        required={required}
        dateFormat="MMM d, yyyy h:mm aa"
        placeholderText={placeholder}
        className="input"
        calendarClassName="fms-datepicker"
        wrapperClassName="block"
        popperClassName={`fms-datepicker-popper z-50 ${isClosing ? 'fms-datepicker-popper--closing' : ''}`}
      />
    </div>
  )
}
