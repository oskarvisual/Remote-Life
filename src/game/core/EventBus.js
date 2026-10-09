export const events = new EventTarget();
export const emit = (type, detail = {}) => events.dispatchEvent(new CustomEvent(type, { detail }));
export const on = (type, fn) => { events.addEventListener(type, fn); return () => events.removeEventListener(type, fn); };
