import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import RenderQualityMenu from './RenderQualityMenu';
import { RENDER_FPS_UPDATE_EVENT } from '@/game/rendering/renderQuality';

describe('RenderQualityMenu', () => {
  beforeEach(() => window.localStorage.clear());

  it('defaults to baseline quality and exposes the future high-fidelity option', () => {
    render(<RenderQualityMenu />);
    expect(screen.getByRole('button', { name: '画质设置：基础画质' })).toBeInTheDocument();
    expect(screen.getByTestId('realtime-fps-indicator')).toHaveTextContent('—');
    fireEvent.click(screen.getByRole('button', { name: '画质设置：基础画质' }));
    expect(screen.getByRole('menuitemradio', { name: /高保真画质/ })).toBeInTheDocument();
  });

  it('renders live FPS and applies green, amber and red guidance tones', () => {
    render(<RenderQualityMenu />);
    const indicator = screen.getByTestId('realtime-fps-indicator');
    act(() => window.dispatchEvent(new CustomEvent(RENDER_FPS_UPDATE_EVENT, { detail: { fps: 58.4 } })));
    expect(indicator).toHaveTextContent('58.4');
    expect(indicator.className).toContain('text-emerald-300');
    act(() => window.dispatchEvent(new CustomEvent(RENDER_FPS_UPDATE_EVENT, { detail: { fps: 42 } })));
    expect(indicator.className).toContain('text-amber-300');
    act(() => window.dispatchEvent(new CustomEvent(RENDER_FPS_UPDATE_EVENT, { detail: { fps: 24.5 } })));
    expect(indicator.className).toContain('text-rose-300');
    fireEvent.click(screen.getByRole('button', { name: '画质设置：基础画质' }));
    expect(screen.getByTestId('menu-fps-summary')).toHaveTextContent('24.5 FPS');
  });

  it('persists the selected profile and broadcasts a runtime change', () => {
    render(<RenderQualityMenu />);
    const changes: string[] = [];
    window.addEventListener('ice-snow-city:render-quality-change', (event) => {
      changes.push((event as CustomEvent<{ profile: string }>).detail.profile);
    });
    fireEvent.click(screen.getByRole('button', { name: '画质设置：基础画质' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /高保真画质/ }));
    expect(window.localStorage.getItem('ice-snow-city-render-quality')).toBe('high');
    expect(changes).toEqual(['high']);
    expect(screen.getByRole('button', { name: '画质设置：高保真画质' })).toBeInTheDocument();
  });
});
