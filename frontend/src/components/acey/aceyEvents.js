// Pages report learner actions without depending on the companion. If Acey is
// not mounted (signed out, tests, older layouts) the event is simply ignored.
export const ACEY_EVENT = 'acey:event';

export const emitAceyEvent = (type, detail = {}) => {
  if (typeof window === 'undefined' || typeof window.CustomEvent !== 'function') return;
  try {
    window.dispatchEvent(new window.CustomEvent(ACEY_EVENT, { detail: { ...detail, type } }));
  } catch (error) {
    // A companion reaction must never interrupt the learning flow.
  }
};
