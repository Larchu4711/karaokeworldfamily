const KEY = "pm-device-id";
/** Anonymous per-browser id so one phone can like each performance only once. */
export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id || !/^[0-9a-f-]{32,36}$/i.test(id)) { id = crypto.randomUUID(); localStorage.setItem(KEY, id); }
  return id;
}
