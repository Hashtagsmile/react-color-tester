// Tiny event bus so the "How it works" button anywhere can re-open the guide
// without threading UI state through context.
const EVENT = "theme-lab:open-guide";

export const openGuide = () => window.dispatchEvent(new Event(EVENT));

export const onOpenGuide = (handler) => {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
};
