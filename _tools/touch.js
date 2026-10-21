// Low-level finger swipe via CDP touch events (synthesizeScrollGesture is a no-op in headless Chrome).
module.exports = async function swipe(cdp, x, y, dx, dy = 0, steps = 12) {
  const point = (px, py) => [{ x: px, y: py, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(x, y) });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(x + (dx * i) / steps, y + (dy * i) / steps) });
    await new Promise(r => setTimeout(r, 16));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
};
