import { isValid } from 'date-fns'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

type DatePickerInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  maxDate?: Date
  minDate?: Date
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  maxDate,
  minDate,
}: DatePickerInputProps) {
  const selectedDate = parseIsoDate(value)

  return (
    <DatePicker
      selected={selectedDate}
      onChange={(date: Date | null) => {
        onChange(date && isValid(date) ? formatIsoDate(date) : '')
      }}
      disabled={disabled}
      maxDate={maxDate}
      minDate={minDate}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
      isClearable
      dateFormat="MMM d, yyyy"
      placeholderText={placeholder}
      className="input"
      calendarClassName="fms-datepicker"
      wrapperClassName="block"
      popperClassName="fms-datepicker-popper z-50"
    />
  )
}

function parseIsoDate(value: string) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  const date = new Date(year, month - 1, day)
  return isValid(date) ? date : null
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
