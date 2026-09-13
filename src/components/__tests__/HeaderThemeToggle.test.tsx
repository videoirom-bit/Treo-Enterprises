import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import { Header } from '../Header';

describe('Header Theme Toggle & Local Storage Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should render the theme toggle button with appropriate initial state', () => {
    render(
      <AppProvider>
        <Header />
      </AppProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('should toggle theme from light to dark, persist in localStorage, and add dark class to html document', async () => {
    render(
      <AppProvider>
        <Header />
      </AppProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Click toggle button to switch to dark mode
    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    // Verify DOM class and updated aria-label
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to light mode');

    // Verify localStorage persistence
    expect(localStorage.getItem('abc_stationery_v1_dark')).toBe('true');
    expect(localStorage.getItem('theme')).toBe('dark');

    // Click toggle button again to switch back to light mode
    await act(async () => {
      fireEvent.click(toggleBtn);
    });

    // Verify DOM class and updated aria-label
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(toggleBtn).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(localStorage.getItem('abc_stationery_v1_dark')).toBe('false');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should initialize in dark mode if localStorage already stores dark preference', () => {
    localStorage.setItem('abc_stationery_v1_dark', 'true');
    localStorage.setItem('theme', 'dark');

    render(
      <AppProvider>
        <Header />
      </AppProvider>
    );

    const toggleBtn = screen.getByRole('button', { name: /switch to light mode/i });
    expect(toggleBtn).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
