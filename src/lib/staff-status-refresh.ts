type StaffStatus = { request: { status: string } | null };

/** Only pending requests poll; the existing server remains the permission authority. */
export function staffStatusRefreshInterval(status: StaffStatus | undefined): number | false {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  return status?.request?.status === "pendiente" ? 5_000 : false;
}