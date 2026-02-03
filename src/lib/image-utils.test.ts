/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processImage, getBase64Size } from './image-utils'

// Mock FileReader
const mockFileReader = {
  readAsDataURL: vi.fn(),
  onload: null as (() => void) | null,
  onerror: null as ((error: Error) => void) | null,
  result: null as string | null,
}

// Mock Image
const mockImage = {
  onload: null as (() => void) | null,
  onerror: null as (() => void) | null,
  src: '',
  width: 0,
  height: 0,
}

// Mock Canvas context
const mockContext = {
  drawImage: vi.fn(),
}

// Mock Canvas
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => mockContext),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,/9j/compressed'),
}

describe('image-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock state
    mockFileReader.onload = null
    mockFileReader.onerror = null
    mockFileReader.result = null
    mockImage.onload = null
    mockImage.onerror = null
    mockImage.src = ''
    mockCanvas.getContext = vi.fn(() => mockContext)

    // Setup FileReader mock
    vi.stubGlobal(
      'FileReader',
      vi.fn(() => mockFileReader)
    )
    mockFileReader.readAsDataURL = vi.fn(function (this: typeof mockFileReader) {
      setTimeout(() => {
        this.result = 'data:image/png;base64,testdata'
        if (this.onload) this.onload()
      }, 0)
    })

    // Setup Image mock
    vi.stubGlobal(
      'Image',
      vi.fn(() => mockImage)
    )

    // Setup canvas mock
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as unknown as HTMLCanvasElement
      }
      return originalCreateElement(tagName)
    })
  })

  describe('processImage', () => {
    it('should process an image file and return a data URL', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      // Setup image load simulation
      mockImage.width = 1600
      mockImage.height = 1200

      const processPromise = processImage(file)

      // Wait for FileReader to complete
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Trigger image load
      if (mockImage.onload) mockImage.onload()

      const result = await processPromise

      expect(result).toMatch(/^data:image\/jpeg;base64,/)
      expect(mockContext.drawImage).toHaveBeenCalled()
      expect(mockCanvas.toDataURL).toHaveBeenCalledWith('image/jpeg', 0.6)
    })

    it('should resize large images to max 800px maintaining aspect ratio (landscape)', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      // Landscape image: 1600x1200
      mockImage.width = 1600
      mockImage.height = 1200

      const processPromise = processImage(file)

      await new Promise((resolve) => setTimeout(resolve, 10))
      if (mockImage.onload) mockImage.onload()

      await processPromise

      // Width should be 800, height should scale proportionally (600)
      expect(mockCanvas.width).toBe(800)
      expect(mockCanvas.height).toBe(600)
    })

    it('should resize large images to max 800px maintaining aspect ratio (portrait)', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      // Portrait image: 1200x1600
      mockImage.width = 1200
      mockImage.height = 1600

      const processPromise = processImage(file)

      await new Promise((resolve) => setTimeout(resolve, 10))
      if (mockImage.onload) mockImage.onload()

      await processPromise

      // Height should be 800, width should scale proportionally (600)
      expect(mockCanvas.width).toBe(600)
      expect(mockCanvas.height).toBe(800)
    })

    it('should not resize images smaller than max size', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      // Small image: 400x300
      mockImage.width = 400
      mockImage.height = 300

      const processPromise = processImage(file)

      await new Promise((resolve) => setTimeout(resolve, 10))
      if (mockImage.onload) mockImage.onload()

      await processPromise

      // Should keep original dimensions
      expect(mockCanvas.width).toBe(400)
      expect(mockCanvas.height).toBe(300)
    })

    it('should reject if FileReader fails', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      mockFileReader.readAsDataURL = vi.fn(function (this: typeof mockFileReader) {
        setTimeout(() => {
          if (this.onerror) this.onerror(new Error('Read failed'))
        }, 0)
      })

      await expect(processImage(file)).rejects.toThrow()
    })

    it('should reject if Image fails to load', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      mockImage.width = 800
      mockImage.height = 600

      const processPromise = processImage(file)

      await new Promise((resolve) => setTimeout(resolve, 10))
      if (mockImage.onerror) mockImage.onerror()

      await expect(processPromise).rejects.toThrow('Failed to load image')
    })

    it('should reject if canvas context is unavailable', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' })

      mockImage.width = 800
      mockImage.height = 600
      mockCanvas.getContext = vi.fn(() => null)

      const processPromise = processImage(file)

      await new Promise((resolve) => setTimeout(resolve, 10))
      if (mockImage.onload) mockImage.onload()

      await expect(processPromise).rejects.toThrow('Failed to get canvas context')
    })
  })

  describe('getBase64Size', () => {
    it('should calculate approximate size of base64 data URL', () => {
      // Base64 string of 4 characters represents 3 bytes
      const dataUrl = 'data:image/jpeg;base64,AAAA'
      const size = getBase64Size(dataUrl)

      // 4 base64 chars = 3 bytes
      expect(size).toBe(3)
    })

    it('should handle data URLs with longer content', () => {
      // 8 base64 chars = 6 bytes
      const dataUrl = 'data:image/jpeg;base64,AAAAAAAA'
      const size = getBase64Size(dataUrl)

      expect(size).toBe(6)
    })

    it('should handle raw base64 strings', () => {
      const base64 = 'AAAA'
      const size = getBase64Size(base64)

      expect(size).toBe(3)
    })
  })
})
