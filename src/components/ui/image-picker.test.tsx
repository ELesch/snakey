// Tests for ImagePicker component
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImagePicker } from './image-picker'

// URL.createObjectURL and URL.revokeObjectURL are mocked globally in src/test/setup.ts

beforeEach(() => {
  // Clear mock call history before each test
  vi.mocked(URL.createObjectURL).mockClear()
  vi.mocked(URL.revokeObjectURL).mockClear()
  // Set up default return value
  vi.mocked(URL.createObjectURL).mockReturnValue('blob:mock-url')
})

afterEach(() => {
  vi.clearAllMocks()
})

// Helper to create a mock file
function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  const content = new Array(size).fill('a').join('')
  return new File([content], name, { type })
}

describe('ImagePicker', () => {
  const defaultProps = {
    value: null,
    preview: null,
    onChange: vi.fn(),
  }

  describe('rendering', () => {
    it('should render empty state without label', () => {
      render(<ImagePicker {...defaultProps} />)

      expect(screen.getByText('Drag and drop an image here')).toBeInTheDocument()
      expect(screen.getByText('Choose File')).toBeInTheDocument()
    })

    it('should render with label when provided', () => {
      render(<ImagePicker {...defaultProps} label="Profile Photo" />)

      expect(screen.getByText('Profile Photo')).toBeInTheDocument()
    })

    it('should display accepted file types in help text', () => {
      render(<ImagePicker {...defaultProps} />)

      expect(screen.getByText(/JPEG, PNG, WEBP, HEIC up to 10MB/i)).toBeInTheDocument()
    })

    it('should display custom max file size', () => {
      render(<ImagePicker {...defaultProps} maxSizeMB={5} />)

      expect(screen.getByText(/up to 5MB/i)).toBeInTheDocument()
    })

    it('should have accessible role and aria-label', () => {
      render(<ImagePicker {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute(
        'aria-label',
        'Upload image. Press Enter or Space to select a file, or drag and drop an image.'
      )
    })
  })

  describe('file selection via click', () => {
    it('should have a hidden file input', () => {
      render(<ImagePicker {...defaultProps} />)

      const input = document.querySelector('input[type="file"]')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('sr-only')
    })

    it('should accept correct file types by default', () => {
      render(<ImagePicker {...defaultProps} />)

      const input = document.querySelector('input[type="file"]')
      expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp,image/heic')
    })

    it('should accept custom file types', () => {
      render(<ImagePicker {...defaultProps} accept="image/gif" />)

      const input = document.querySelector('input[type="file"]')
      expect(input).toHaveAttribute('accept', 'image/gif')
    })

    it('should call onChange with file and preview when valid file selected', async () => {
      const onChange = vi.fn()
      render(<ImagePicker {...defaultProps} onChange={onChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')

      fireEvent.change(input, { target: { files: [file] } })

      expect(vi.mocked(URL.createObjectURL)).toHaveBeenCalledWith(file)
      expect(onChange).toHaveBeenCalledWith(file, 'blob:mock-url')
    })
  })

  describe('file validation', () => {
    it('should reject files that are too large', async () => {
      const onChange = vi.fn()
      render(<ImagePicker {...defaultProps} onChange={onChange} maxSizeMB={1} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      // Create a file larger than 1MB (1.5MB)
      const file = createMockFile('large.jpg', 1.5 * 1024 * 1024, 'image/jpeg')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('File size must be less than 1MB')
      })
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should reject invalid file types', async () => {
      const onChange = vi.fn()
      render(<ImagePicker {...defaultProps} onChange={onChange} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('document.pdf', 1024, 'application/pdf')

      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'Please select a valid image file (JPEG, PNG, WEBP, HEIC)'
        )
      })
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should accept valid file within size limit', async () => {
      const onChange = vi.fn()
      render(<ImagePicker {...defaultProps} onChange={onChange} maxSizeMB={10} />)

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = createMockFile('photo.png', 5 * 1024 * 1024, 'image/png')

      fireEvent.change(input, { target: { files: [file] } })

      expect(onChange).toHaveBeenCalledWith(file, 'blob:mock-url')
    })
  })

  describe('preview display', () => {
    it('should show preview image when provided', () => {
      render(
        <ImagePicker
          {...defaultProps}
          value={createMockFile('test.jpg', 1024, 'image/jpeg')}
          preview="blob:preview-url"
        />
      )

      const img = screen.getByRole('img', { name: 'Preview' })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'blob:preview-url')
    })

    it('should update aria-label when image is selected', () => {
      render(
        <ImagePicker
          {...defaultProps}
          value={createMockFile('test.jpg', 1024, 'image/jpeg')}
          preview="blob:preview-url"
        />
      )

      // Get the main drop zone button (not the remove button)
      const buttons = screen.getAllByRole('button')
      const dropZone = buttons.find(
        btn => btn.getAttribute('aria-label')?.includes('Image selected')
      )
      expect(dropZone).toHaveAttribute(
        'aria-label',
        'Image selected. Press Enter or Space to change, or drag and drop a new image.'
      )
    })

    it('should show remove button when image is selected', () => {
      render(
        <ImagePicker
          {...defaultProps}
          value={createMockFile('test.jpg', 1024, 'image/jpeg')}
          preview="blob:preview-url"
        />
      )

      expect(screen.getByRole('button', { name: 'Remove image' })).toBeInTheDocument()
    })
  })

  describe('remove image', () => {
    it('should call onChange with null when remove button clicked', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <ImagePicker
          {...defaultProps}
          value={createMockFile('test.jpg', 1024, 'image/jpeg')}
          preview="blob:preview-url"
          onChange={onChange}
        />
      )

      await user.click(screen.getByRole('button', { name: 'Remove image' }))

      expect(onChange).toHaveBeenCalledWith(null, null)
    })

    it('should revoke blob URL when removing image', async () => {
      const user = userEvent.setup()
      render(
        <ImagePicker
          {...defaultProps}
          value={createMockFile('test.jpg', 1024, 'image/jpeg')}
          preview="blob:preview-url"
        />
      )

      await user.click(screen.getByRole('button', { name: 'Remove image' }))

      expect(vi.mocked(URL.revokeObjectURL)).toHaveBeenCalledWith('blob:preview-url')
    })

    it('should not revoke http URLs when removing', async () => {
      const user = userEvent.setup()
      render(
        <ImagePicker
          {...defaultProps}
          value={null}
          preview={null}
          existingImageUrl="https://example.com/photo.jpg"
        />
      )

      // With existing URL, clicking remove should not try to revoke it
      await user.click(screen.getByRole('button', { name: 'Remove image' }))

      // Should not call revokeObjectURL for http URLs
      expect(vi.mocked(URL.revokeObjectURL)).not.toHaveBeenCalledWith('https://example.com/photo.jpg')
    })
  })

  describe('existing image URL', () => {
    it('should show existing image when no new image selected', () => {
      render(
        <ImagePicker
          {...defaultProps}
          existingImageUrl="https://example.com/existing-photo.jpg"
        />
      )

      const img = screen.getByRole('img', { name: 'Preview' })
      expect(img).toHaveAttribute('src', 'https://example.com/existing-photo.jpg')
    })

    it('should show new preview over existing URL when new file selected', () => {
      render(
        <ImagePicker
          {...defaultProps}
          value={createMockFile('new.jpg', 1024, 'image/jpeg')}
          preview="blob:new-preview"
          existingImageUrl="https://example.com/existing-photo.jpg"
        />
      )

      const img = screen.getByRole('img', { name: 'Preview' })
      expect(img).toHaveAttribute('src', 'blob:new-preview')
    })
  })

  describe('disabled state', () => {
    it('should not open file dialog when disabled', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<ImagePicker {...defaultProps} onChange={onChange} disabled />)

      const dropZone = screen.getByRole('button')
      expect(dropZone).toHaveAttribute('aria-disabled', 'true')

      await user.click(dropZone)

      // Input should also be disabled
      const input = document.querySelector('input[type="file"]')
      expect(input).toBeDisabled()
    })

    it('should have reduced opacity when disabled', () => {
      render(<ImagePicker {...defaultProps} disabled />)

      const dropZone = screen.getByRole('button')
      expect(dropZone).toHaveClass('opacity-50')
      expect(dropZone).toHaveClass('cursor-not-allowed')
    })

    it('should hide remove button when disabled with image', () => {
      render(
        <ImagePicker
          {...defaultProps}
          value={createMockFile('test.jpg', 1024, 'image/jpeg')}
          preview="blob:preview-url"
          disabled
        />
      )

      expect(screen.queryByRole('button', { name: 'Remove image' })).not.toBeInTheDocument()
    })

    it('should not accept tabIndex when disabled', () => {
      render(<ImagePicker {...defaultProps} disabled />)

      const dropZone = screen.getByRole('button')
      expect(dropZone).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('error display', () => {
    it('should show error message when error prop provided', () => {
      render(<ImagePicker {...defaultProps} error="Photo is required" />)

      expect(screen.getByRole('alert')).toHaveTextContent('Photo is required')
    })

    it('should have error styling on border when error present', () => {
      render(<ImagePicker {...defaultProps} error="Error message" />)

      const dropZone = screen.getByRole('button')
      expect(dropZone).toHaveClass('border-[var(--color-destructive)]')
    })

    it('should clear validation error when valid file selected', async () => {
      const onChange = vi.fn()
      render(<ImagePicker {...defaultProps} onChange={onChange} />)

      // First trigger a validation error
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const invalidFile = createMockFile('doc.txt', 1024, 'text/plain')
      fireEvent.change(input, { target: { files: [invalidFile] } })

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })

      // Now select a valid file
      const validFile = createMockFile('photo.jpg', 1024, 'image/jpeg')
      fireEvent.change(input, { target: { files: [validFile] } })

      await waitFor(() => {
        expect(screen.queryByText(/Please select a valid image file/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('keyboard accessibility', () => {
    it('should open file dialog on Enter key', async () => {
      const user = userEvent.setup()
      render(<ImagePicker {...defaultProps} />)

      const dropZone = screen.getByRole('button')
      dropZone.focus()

      // Create a spy on the input click
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(input, 'click')

      await user.keyboard('{Enter}')

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should open file dialog on Space key', async () => {
      const user = userEvent.setup()
      render(<ImagePicker {...defaultProps} />)

      const dropZone = screen.getByRole('button')
      dropZone.focus()

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(input, 'click')

      await user.keyboard(' ')

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should not open file dialog on Enter when disabled', async () => {
      const user = userEvent.setup()
      render(<ImagePicker {...defaultProps} disabled />)

      const dropZone = screen.getByRole('button')
      dropZone.focus()

      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const clickSpy = vi.spyOn(input, 'click')

      await user.keyboard('{Enter}')

      expect(clickSpy).not.toHaveBeenCalled()
    })
  })

  describe('drag and drop', () => {
    it('should show drag indicator when dragging over', () => {
      render(<ImagePicker {...defaultProps} />)

      const dropZone = screen.getByRole('button')

      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })

      expect(screen.getByText('Drop image here')).toBeInTheDocument()
    })

    it('should reset drag indicator when dragging leaves', () => {
      render(<ImagePicker {...defaultProps} />)

      const dropZone = screen.getByRole('button')

      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })
      expect(screen.getByText('Drop image here')).toBeInTheDocument()

      fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } })
      expect(screen.getByText('Drag and drop an image here')).toBeInTheDocument()
    })

    it('should accept dropped files', () => {
      const onChange = vi.fn()
      render(<ImagePicker {...defaultProps} onChange={onChange} />)

      const dropZone = screen.getByRole('button')
      const file = createMockFile('dropped.jpg', 1024, 'image/jpeg')

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })

      expect(onChange).toHaveBeenCalledWith(file, 'blob:mock-url')
    })

    it('should not accept dropped files when disabled', () => {
      const onChange = vi.fn()
      render(<ImagePicker {...defaultProps} onChange={onChange} disabled />)

      const dropZone = screen.getByRole('button')
      const file = createMockFile('dropped.jpg', 1024, 'image/jpeg')

      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] },
      })

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should not show drag indicator when disabled', () => {
      render(<ImagePicker {...defaultProps} disabled />)

      const dropZone = screen.getByRole('button')

      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })

      // Should not change text to "Drop image here"
      expect(screen.queryByText('Drop image here')).not.toBeInTheDocument()
    })
  })

  describe('memory management', () => {
    it('should revoke old preview URL when selecting new file', () => {
      const onChange = vi.fn()
      const { rerender } = render(
        <ImagePicker
          {...defaultProps}
          value={createMockFile('old.jpg', 1024, 'image/jpeg')}
          preview="blob:old-preview"
          onChange={onChange}
        />
      )

      // Select new file
      const input = document.querySelector('input[type="file"]') as HTMLInputElement
      const newFile = createMockFile('new.jpg', 1024, 'image/jpeg')

      fireEvent.change(input, { target: { files: [newFile] } })

      expect(vi.mocked(URL.revokeObjectURL)).toHaveBeenCalledWith('blob:old-preview')
    })
  })

  describe('custom className', () => {
    it('should apply custom className to container', () => {
      const { container } = render(
        <ImagePicker {...defaultProps} className="my-custom-class" />
      )

      expect(container.firstChild).toHaveClass('my-custom-class')
    })
  })
})
