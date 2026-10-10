#!/usr/bin/env python3
"""Chromium touch emulation smoke test for the two-tab Ice Snow City web game.

Usage: python3 scripts/smokeMobileTouch.py [game_url]
Emulation is NOT real iOS/Android-device evidence.
"""
import re
import sys
import time
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3000/game?skipSplash=1'


def position(locator):
    style = locator.get_attribute('style') or ''
    match = re.search(r'left: ([\d.]+)%; top: ([\d.]+)%', style)
    assert match, f'player position missing from {style!r}'
    return float(match.group(1)), float(match.group(2))


def touch(cdp, event_type, x=None, y=None):
    points = [] if x is None else [{'x': x, 'y': y, 'id': 0}]
    cdp.send('Input.dispatchTouchEvent', {'type': event_type, 'touchPoints': points})


def check(browser, width, height):
    context = browser.new_context(viewport={'width': width, 'height': height}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(URL, wait_until='domcontentloaded', timeout=30000)
    scene = page.get_by_test_id('city-district-scene')
    scene.wait_for(timeout=20000)
    page.locator('.isc-commercial-street__plate').evaluate('(img) => img.decode()')
    assert page.get_by_role('navigation', name='游戏主导航').get_by_role('button').count() == 2
    viewport_height = page.evaluate('window.innerHeight')
    for name in ['向前走', '向左走', '向后走', '向右走', '推进一次城市资源循环', '花费 1 ISC 补给水电']:
        button = page.get_by_role('button', name=name)
        box = button.bounding_box()
        assert box and box['width'] >= 40 and box['height'] >= 40, f'{name} too small: {box}'
        assert box['y'] >= 0 and box['y'] + box['height'] <= viewport_height, f'{name} outside viewport: {box}'
    player = page.get_by_test_id('street-player')
    image = page.locator('.isc-commercial-street__plate')
    box = image.bounding_box()
    assert box and box['height'] > 170
    cdp = context.new_cdp_session(page)

    # A single-finger tap places the player on the accessible pavement.
    x, y = box['x'] + box['width'] * .5, box['y'] + box['height'] * .70
    page.touchscreen.tap(x, y)
    assert abs(position(player)[1] - 70) <= .2, f'tap failed: {position(player)}'

    # Actual touch stream pans the 2.5D world; tapping (not dragging) moves the player.
    world = page.get_by_test_id('street-view-world')
    before_pan = world.get_attribute('style') or ''
    touch(cdp, 'touchStart', x, y)
    touch(cdp, 'touchMove', x + box['width'] * .04, y + box['height'] * .10)
    touch(cdp, 'touchMove', x + box['width'] * .06, y + box['height'] * .12)
    touch(cdp, 'touchEnd')
    after_pan = world.get_attribute('style') or ''
    assert after_pan != before_pan, f'view pan did not change: {before_pan!r} -> {after_pan!r}'
    assert position(player)[0] == 50 and position(player)[1] == 70, f'drag moved player unexpectedly: {position(player)}'
    assert page.get_by_test_id('street-shop-card').count() == 0, 'drag accidentally opened a location'

    # Hold the D-pad: repeats after 230ms; release cancels repeat.
    forward = page.get_by_role('button', name='向前走').bounding_box()
    assert forward
    px, py = forward['x'] + forward['width'] / 2, forward['y'] + forward['height'] / 2
    before = position(player)[1]
    touch(cdp, 'touchStart', px, py)
    time.sleep(.56)
    touch(cdp, 'touchEnd')
    after = position(player)[1]
    assert after <= before - 5, f'hold did not repeat: {before} -> {after}'
    time.sleep(.24)
    assert position(player)[1] == after, 'movement continued after release'

    # Hotspot tap must open only its own information card.
    page.get_by_role('button', name='走访雪栖咖啡').tap()
    assert page.get_by_test_id('street-shop-card').count() == 1
    page.get_by_role('button', name='关闭店铺详情').tap()
    page.get_by_role('button', name='城市运营').tap()
    assert page.get_by_test_id('core-resource-cycle').count() == 1
    page.get_by_role('button', name='返回城市街区').tap()
    assert scene.count() == 1
    assert not errors, f'page errors: {errors}'
    context.close()
    print(f'PASS {width}x{height}: tap, drag, press/hold/release, shop, two-tab navigation')


if __name__ == '__main__':
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
        try:
            for size in [(844, 390), (667, 375)]:
                check(browser, *size)
        finally:
            browser.close()
