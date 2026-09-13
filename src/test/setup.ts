import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock canvas-confetti to prevent JSDOM canvas getContext warnings
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock window.scrollTo
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn();
}

