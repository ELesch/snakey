// Tests for shared form components
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  FormField,
  FormTextarea,
  FormCheckbox,
  FormSelect,
  FormError,
} from './form-field'

describe('FormField', () => {
  const defaultProps = {
    id: 'test-field',
    name: 'testField',
    label: 'Test Label',
    value: '',
    onChange: vi.fn(),
  }

  it('should render label and input', () => {
    render(<FormField {...defaultProps} />)

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should show required indicator when required is true', () => {
    render(<FormField {...defaultProps} required />)

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should not show required indicator when required is false', () => {
    render(<FormField {...defaultProps} required={false} />)

    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  it('should display error message when error prop is provided', () => {
    render(<FormField {...defaultProps} error="This field is required" />)

    expect(screen.getByRole('alert')).toHaveTextContent('This field is required')
  })

  it('should set aria-invalid when error is present', () => {
    render(<FormField {...defaultProps} error="Error message" />)

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('should not set aria-invalid when there is no error', () => {
    render(<FormField {...defaultProps} />)

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false')
  })

  it('should link input to error via aria-describedby', () => {
    render(<FormField {...defaultProps} error="Error message" />)

    const input = screen.getByRole('textbox')
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBe('test-field-error')
    expect(screen.getByRole('alert')).toHaveAttribute('id', errorId)
  })

  it('should call onChange when input value changes', () => {
    const onChange = vi.fn()
    render(<FormField {...defaultProps} onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new value' } })

    expect(onChange).toHaveBeenCalled()
  })

  it('should render with different input types', () => {
    const { rerender } = render(<FormField {...defaultProps} type="date" />)
    expect(screen.getByLabelText('Test Label')).toHaveAttribute('type', 'date')

    rerender(<FormField {...defaultProps} type="number" />)
    expect(screen.getByLabelText('Test Label')).toHaveAttribute('type', 'number')

    rerender(<FormField {...defaultProps} type="email" />)
    expect(screen.getByLabelText('Test Label')).toHaveAttribute('type', 'email')
  })

  it('should display placeholder text', () => {
    render(<FormField {...defaultProps} placeholder="Enter value here" />)

    expect(screen.getByPlaceholderText('Enter value here')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<FormField {...defaultProps} disabled />)

    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  it('should apply custom className', () => {
    render(<FormField {...defaultProps} className="custom-class" />)

    const container = screen.getByRole('textbox').closest('div')
    expect(container).toHaveClass('custom-class')
  })
})

describe('FormTextarea', () => {
  const defaultProps = {
    id: 'test-textarea',
    name: 'testTextarea',
    label: 'Test Textarea',
    value: '',
    onChange: vi.fn(),
  }

  it('should render label and textarea', () => {
    render(<FormTextarea {...defaultProps} />)

    expect(screen.getByLabelText('Test Textarea')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('should show required indicator when required is true', () => {
    render(<FormTextarea {...defaultProps} required />)

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should display error message when error prop is provided', () => {
    render(<FormTextarea {...defaultProps} error="Error message" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Error message')
  })

  it('should set aria-invalid when error is present', () => {
    render(<FormTextarea {...defaultProps} error="Error" />)

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('should call onChange when textarea value changes', () => {
    const onChange = vi.fn()
    render(<FormTextarea {...defaultProps} onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new text' } })

    expect(onChange).toHaveBeenCalled()
  })

  it('should apply custom rows prop', () => {
    render(<FormTextarea {...defaultProps} rows={5} />)

    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5')
  })

  it('should display placeholder text', () => {
    render(<FormTextarea {...defaultProps} placeholder="Enter notes here" />)

    expect(screen.getByPlaceholderText('Enter notes here')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<FormTextarea {...defaultProps} disabled />)

    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})

describe('FormCheckbox', () => {
  const defaultProps = {
    id: 'test-checkbox',
    name: 'testCheckbox',
    label: 'Test Checkbox',
    checked: false,
    onChange: vi.fn(),
  }

  it('should render checkbox with label', () => {
    render(<FormCheckbox {...defaultProps} />)

    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText('Test Checkbox')).toBeInTheDocument()
  })

  it('should be checked when checked prop is true', () => {
    render(<FormCheckbox {...defaultProps} checked />)

    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('should not be checked when checked prop is false', () => {
    render(<FormCheckbox {...defaultProps} checked={false} />)

    expect(screen.getByRole('checkbox')).not.toBeChecked()
  })

  it('should call onChange when checkbox is clicked', () => {
    const onChange = vi.fn()
    render(<FormCheckbox {...defaultProps} onChange={onChange} />)

    fireEvent.click(screen.getByRole('checkbox'))

    expect(onChange).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<FormCheckbox {...defaultProps} disabled />)

    expect(screen.getByRole('checkbox')).toBeDisabled()
  })

  it('should apply custom className', () => {
    render(<FormCheckbox {...defaultProps} className="custom-class" />)

    // The label wraps everything
    const label = screen.getByText('Test Checkbox').closest('label')
    expect(label).toHaveClass('custom-class')
  })
})

describe('FormSelect', () => {
  const defaultProps = {
    id: 'test-select',
    label: 'Test Select',
    value: '',
    onValueChange: vi.fn(),
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
  }

  it('should render label and select trigger', () => {
    render(<FormSelect {...defaultProps} />)

    expect(screen.getByText('Test Select')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should show required indicator when required is true', () => {
    render(<FormSelect {...defaultProps} required />)

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('should display error message when error prop is provided', () => {
    render(<FormSelect {...defaultProps} error="Selection required" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Selection required')
  })

  it('should set aria-invalid on trigger when error is present', () => {
    render(<FormSelect {...defaultProps} error="Error" />)

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('should display placeholder text', () => {
    render(<FormSelect {...defaultProps} placeholder="Choose an option" />)

    expect(screen.getByText('Choose an option')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<FormSelect {...defaultProps} disabled />)

    expect(screen.getByRole('combobox')).toBeDisabled()
  })

  it('should display selected value label', () => {
    render(<FormSelect {...defaultProps} value="option2" />)

    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })
})

describe('FormError', () => {
  it('should render nothing when message is null', () => {
    const { container } = render(<FormError message={null} />)

    expect(container.firstChild).toBeNull()
  })

  it('should render nothing when message is undefined', () => {
    const { container } = render(<FormError message={undefined} />)

    expect(container.firstChild).toBeNull()
  })

  it('should render nothing when message is empty string', () => {
    const { container } = render(<FormError message="" />)

    // Empty string is falsy, so it should render null
    expect(container.firstChild).toBeNull()
  })

  it('should render error message when provided', () => {
    render(<FormError message="Something went wrong" />)

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
  })

  it('should have role="alert" for screen readers', () => {
    render(<FormError message="Error occurred" />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('should have aria-live="polite"', () => {
    render(<FormError message="Error message" />)

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
  })

  it('should render with alert icon', () => {
    render(<FormError message="Error message" />)

    // The AlertCircle icon should have aria-hidden="true"
    const alert = screen.getByRole('alert')
    const hiddenIcon = alert.querySelector('[aria-hidden="true"]')
    expect(hiddenIcon).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<FormError message="Error" className="custom-error-class" />)

    expect(screen.getByRole('alert')).toHaveClass('custom-error-class')
  })
})
