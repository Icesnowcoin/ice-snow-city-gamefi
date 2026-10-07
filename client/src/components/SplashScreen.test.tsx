import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SplashScreen, { OPENING_HERO_IMAGE } from './SplashScreen';

describe('gameplay-first opening', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('uses the approved Ice Snow City opening hero and shows one clear entry action without any NFT or wallet gate', () => {
    render(<SplashScreen />);
    expect(screen.getByTestId('opening-hero-image').getAttribute('src')).toBe(OPENING_HERO_IMAGE);
    expect(screen.getByTestId('opening-hero-image')).toHaveAttribute('alt', expect.stringContaining('Ice Snow City'));
    expect(screen.getByRole('button', { name: '进入游戏' })).toBeDefined();
    expect(screen.queryByText(/ICE CRYSTALS|商业帝国|NFT|钱包/)).toBeNull();
    expect(screen.getByText(/进度保存在当前浏览器/)).toBeDefined();
  });

  it('enters on first click and removes the overlay after its smooth transition', () => {
    const onComplete = vi.fn();
    render(<SplashScreen onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: '进入游戏' }));
    expect(screen.getByRole('button', { name: '正在进入…' })).toBeDisabled();
    expect(screen.getByTestId('opening-hero-image').closest('[data-transitioning="true"]')).toBeTruthy();
    act(() => vi.advanceTimersByTime(520));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('opening-hero-image')).toBeNull();
  });

  it('cleans up pending transitions if the opening unmounts', () => {
    const onComplete = vi.fn();
    const view = render(<SplashScreen onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: '进入游戏' }));
    view.unmount();
    act(() => vi.advanceTimersByTime(520));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
