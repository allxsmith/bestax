// Synthetic-event helpers for the scripted homepage demos. The components
// use React's delegated listeners, so dispatched bubbling events reach them
// even inside the shadow root.

export function dispatchKey(el, key) {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  );
}

export function dispatchClick(el) {
  for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup']) {
    const Ctor = type.startsWith('pointer') ? PointerEvent : MouseEvent;
    el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true }));
  }
  el.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true })
  );
}

// Set a controlled input's value through the native setter so React's
// onChange/onInput handlers fire as if the user typed.
export function dispatchNativeInput(input, value) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
