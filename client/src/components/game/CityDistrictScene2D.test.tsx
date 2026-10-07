import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CityDistrictScene2D, { COMMERCIAL_STREET_ART, clampStreetPosition, clampStreetViewOffset, getStreetLighting, streetPositionFromPointer } from './CityDistrictScene2D';
import { CITY_DISTRICTS } from './cityDistrictScenes';
import { INITIAL_CORE_RESOURCES } from './coreResourceCycle';

describe('CityDistrictScene2D', () => {
  it('keeps the strategy goal collapsed until requested so shops remain accessible', () => {
    render(<CityDistrictScene2D resources={INITIAL_CORE_RESOURCES} />);
    expect(screen.getByTestId('city-supply-objective')).toHaveAttribute('data-expanded', 'false');
    expect(screen.queryByText(/走访丰盈生产园的食品加工坊/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '走访雪栖咖啡' }));
    expect(screen.getByTestId('street-shop-card')).toHaveTextContent('雪栖咖啡');
    fireEvent.click(screen.getByRole('button', { name: '展开城市供应目标' }));
    expect(screen.getByTestId('city-supply-objective')).toHaveAttribute('data-expanded', 'true');
    expect(screen.getByText(/走访丰盈生产园的食品加工坊/)).toBeDefined();
  });

  it('shows the city as an operating simulation with building output and paused state', () => {
    render(<CityDistrictScene2D resources={INITIAL_CORE_RESOURCES} buildingLevels={{ production: 2 }} operatingState={{ commercial: false }} />);
    expect(screen.getByTestId('city-building-strip')).toBeDefined();
    expect(screen.getByTestId('city-building-production')).toHaveTextContent('Lv.2');
    expect(screen.getByTestId('city-building-production')).toHaveTextContent('物资 +5');
    expect(screen.getByTestId('city-building-commercial')).toHaveTextContent('已停机');
    expect(screen.getByTestId('city-building-commercial')).toHaveTextContent('本轮不参与循环');
  });

  it('makes building operations actionable from the city view', () => {
    const onToggleBuilding = vi.fn();
    const onUpgradeBuilding = vi.fn();
    render(<CityDistrictScene2D resources={INITIAL_CORE_RESOURCES} onToggleBuilding={onToggleBuilding} onUpgradeBuilding={onUpgradeBuilding} />);
    fireEvent.click(screen.getByRole('button', { name: '停机丰盈生产园' }));
    fireEvent.click(screen.getByRole('button', { name: '升级丰盈生产园' }));
    expect(onToggleBuilding).toHaveBeenCalledWith('production');
    expect(onUpgradeBuilding).toHaveBeenCalledWith('production');
  });

  it('shows the result of the latest resource cycle inside the playable scene', () => {
    render(<CityDistrictScene2D resources={{ ...INITIAL_CORE_RESOURCES, cycle: 1, goods: 3 }} lastCycleEvents={[{ kind: 'success', message: '生产区完成一轮制造，获得 5 单位城市物资。' }]} onRunCycle={vi.fn()} />);
    expect(screen.getByTestId('district-cycle-result')).toHaveTextContent('生产区完成一轮制造');
    expect(screen.getByTestId('district-city-loop')).toHaveTextContent('第 1 轮');
  });
  it('uses exactly one base plate per district and the same live day/night light layer', () => {
    const { container, rerender } = render(<CityDistrictScene2D gameTime={900} />);
    const selector = screen.getByRole('combobox', { name: '选择城市区域' });
    const plate = () => container.querySelector('.isc-commercial-street__plate') as HTMLImageElement;
    expect(plate().getAttribute('src')).toBe(COMMERCIAL_STREET_ART.day);
    expect(screen.getByTestId('street-lighting-phase')).toHaveTextContent('白昼');
    expect(screen.getByTestId('city-district-scene')).toBeDefined();
    for (const scene of CITY_DISTRICTS) {
      fireEvent.change(selector, { target: { value: scene.id } });
      expect(container.querySelectorAll('.isc-commercial-street__plate')).toHaveLength(1);
      expect(plate().getAttribute('src')).toBe(scene.baseImage);
      expect(screen.getByRole('heading', { name: scene.title })).toBeDefined();
      expect(screen.getAllByRole('button', { name: /^走访/ })).toHaveLength(scene.hotspots.length);
    }
    rerender(<CityDistrictScene2D gameTime={2000} />);
    expect(screen.getByTestId('street-lighting-phase')).toHaveTextContent('夜间');
    expect(container.querySelector('.isc-commercial-street__night-shade')).toHaveStyle({ opacity: '0.62' });
    expect(plate().getAttribute('src')).toBe(CITY_DISTRICTS.at(-1)?.baseImage);
  });

  it('smoothly interpolates the same plate through dawn and dusk', () => {
    expect(getStreetLighting(200).night).toBe(1);
    expect(getStreetLighting(625).night).toBeCloseTo(0.5);
    expect(getStreetLighting(900).night).toBe(0);
    expect(getStreetLighting(1775).night).toBeCloseTo(0.5);
    expect(getStreetLighting(2000).night).toBe(1);
  });

  it('bounds walking to the center path and resets the player on district transition', () => {
    expect(clampStreetPosition({ x: -200, y: -200 })).toEqual({ x: 41, y: 58 });
    const { container } = render(<CityDistrictScene2D />);
    fireEvent.click(screen.getByRole('button', { name: '向前走' }));
    expect(screen.getByTestId('street-player').getAttribute('style')).toContain('76.4%');
    fireEvent.keyDown(window, { key: 'd' });
    expect(screen.getByTestId('street-player').getAttribute('style')).toContain('52.6%');
    fireEvent.click(screen.getByRole('button', { name: '走访雪栖咖啡' }));
    expect(screen.getByTestId('street-shop-card')).toHaveTextContent('雪栖咖啡');
    fireEvent.click(screen.getByRole('button', { name: '走访地点' }));
    expect(screen.getByRole('button', { name: /已到访/ })).toBeDefined();
    fireEvent.change(screen.getByRole('combobox', { name: '选择城市区域' }), { target: { value: 'civic' } });
    expect(screen.getByTestId('street-player').getAttribute('style')).toContain('79%');
    expect(container.querySelector('[data-testid="street-shop-card"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '走访城市政务厅' }));
    expect(screen.getByTestId('street-shop-card')).toHaveTextContent('城市政务厅');
  });

  it('maps real screen coordinates into walkable pavement and ignores a zero-size image', () => {
    expect(streetPositionFromPointer({ left: 20, top: 50, width: 600, height: 300 }, 320, 287)).toEqual({ x: 50, y: 79 });
    expect(streetPositionFromPointer({ left: 20, top: 50, width: 600, height: 300 }, 900, -100)).toEqual({ x: 59, y: 58 });
    expect(streetPositionFromPointer({ left: 0, top: 0, width: 0, height: 300 }, 30, 20)).toBeNull();
  });

  it('uses a tap for player movement and a one-finger drag for the 2.5D viewpoint', () => {
    const { container } = render(<CityDistrictScene2D />);
    const image = container.querySelector('.isc-commercial-street__plate') as HTMLImageElement;
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 600, height: 300 } as DOMRect);
    fireEvent.pointerDown(image, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: 300, clientY: 237 });
    fireEvent.pointerUp(image, { pointerId: 7, pointerType: 'touch', clientX: 300, clientY: 237 });
    expect(screen.getByTestId('street-player').getAttribute('style')).toContain('79%');
    fireEvent.pointerDown(image, { pointerId: 8, pointerType: 'touch', isPrimary: true, clientX: 300, clientY: 237 });
    fireEvent.pointerMove(image, { pointerId: 8, pointerType: 'touch', clientX: 360, clientY: 220 });
    expect(screen.getByTestId('street-view-world').getAttribute('style')).toContain('--view-pan-x: 7%');
    expect(screen.getByTestId('street-view-world').getAttribute('style')).toContain('--view-pan-y: -4%');
    expect(screen.getByTestId('street-player').getAttribute('style')).toContain('50%');
    fireEvent.pointerUp(image, { pointerId: 8, pointerType: 'touch', clientX: 360, clientY: 220 });
    expect(screen.queryByTestId('street-shop-card')).toBeNull();
  });

  it('cancels a finger gesture without teleporting or treating another finger as primary', () => {
    const { container } = render(<CityDistrictScene2D />);
    const image = container.querySelector('.isc-commercial-street__plate') as HTMLImageElement;
    vi.spyOn(image, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 600, height: 300 } as DOMRect);
    fireEvent.pointerDown(image, { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 300, clientY: 237 });
    fireEvent.pointerCancel(image, { pointerId: 1, pointerType: 'touch' });
    fireEvent.pointerUp(image, { pointerId: 1, pointerType: 'touch', clientX: 360, clientY: 220 });
    fireEvent.pointerDown(image, { pointerId: 2, pointerType: 'touch', isPrimary: false, clientX: 360, clientY: 220 });
    fireEvent.pointerUp(image, { pointerId: 2, pointerType: 'touch', clientX: 360, clientY: 220 });
    expect(screen.getByTestId('street-player').getAttribute('style')).toContain('50%');
    expect(screen.getByTestId('street-view-world').getAttribute('style')).toContain('--view-pan-x: 0%');
  });

  it('keeps viewpoint panning within a compact mobile-friendly range', () => {
    expect(clampStreetViewOffset({ x: 30, y: -20 })).toEqual({ x: 7, y: -4 });
    expect(clampStreetViewOffset({ x: 1.26, y: 2.34 })).toEqual({ x: 1.3, y: 2.3 });
  });

  it('moves once for a tap but repeats while held and stops on pointer release or blur', () => {
    vi.useFakeTimers();
    try {
      render(<CityDistrictScene2D />);
      const up = screen.getByRole('button', { name: '向前走' });
      fireEvent.pointerDown(up, { pointerId: 4, pointerType: 'touch', isPrimary: true });
      expect(screen.getByTestId('street-player').getAttribute('style')).toContain('76.4%');
      act(() => vi.advanceTimersByTime(460));
      expect(screen.getByTestId('street-player').getAttribute('style')).toContain('71.2%');
      fireEvent.pointerUp(up, { pointerId: 4 });
      act(() => vi.advanceTimersByTime(460));
      expect(screen.getByTestId('street-player').getAttribute('style')).toContain('71.2%');
      fireEvent.pointerDown(up, { pointerId: 5, pointerType: 'touch', isPrimary: true });
      fireEvent(window, new Event('blur'));
      act(() => vi.advanceTimersByTime(460));
      expect(screen.getByTestId('street-player').getAttribute('style')).toContain('68.6%');
    } finally { vi.useRealTimers(); }
  });
});
