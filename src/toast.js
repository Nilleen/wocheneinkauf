// Module-level setter shared between showToast() and ToastManager
let _toastSetter = null;

export function showToast(msg) {
  if (_toastSetter) _toastSetter(msg);
}

export function setToastSetter(fn) {
  _toastSetter = fn;
}
