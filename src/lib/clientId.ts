const CLIENT_ID_KEY = 'interview_prep_client_id'

/** Browser-only — call from an event handler or post-mount effect, never during render/SSR. */
export function getOrCreateClientId(): string {
  let id = localStorage.getItem(CLIENT_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(CLIENT_ID_KEY, id)
  }
  return id
}
