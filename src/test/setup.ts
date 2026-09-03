import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

HTMLCanvasElement.prototype.getContext = () => null

afterEach(() => {
  cleanup()
})
