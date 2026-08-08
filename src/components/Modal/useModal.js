import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Track how many modals are open so nested/stacked dialogs don't fight over the lock. */
let lockCount = 0;
let previousOverflow = "";
let previousPaddingRight = "";

const lockScroll = () => {
  if (lockCount === 0) {
    const { body } = document;
    // Compensate for the scrollbar we're about to remove, otherwise the page
    // visibly jumps sideways as the modal opens.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    previousOverflow = body.style.overflow;
    previousPaddingRight = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;
  }
  lockCount += 1;
};

const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow;
    document.body.style.paddingRight = previousPaddingRight;
  }
};

/**
 * The behaviour every dialog is expected to have and which is easy to forget:
 * lock background scroll, close on Escape, keep Tab inside the dialog, and put
 * focus back where it came from on close.
 *
 * Returns a ref to attach to the dialog element.
 */
export const useModal = (open, onClose) => {
  const ref = useRef(null);
  const lastFocused = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    lastFocused.current = document.activeElement;
    lockScroll();

    // Move focus into the dialog so the keyboard starts inside it.
    const node = ref.current;
    const firstFocusable = node?.querySelector(FOCUSABLE);
    (firstFocusable ?? node)?.focus?.();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !node) return;

      const items = [...node.querySelectorAll(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (!items.length) return;

      const first = items[0];
      const last = items[items.length - 1];
      // Wrap at both ends so Tab can never land on the page behind the dialog.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      unlockScroll();
      lastFocused.current?.focus?.();
    };
  }, [open, onClose]);

  return ref;
};
