/** Mirrors App\Support\Engine\PagePath. The complete-page token never leaves the browser. */
export const COMPLETE_STORED = '/complete/[token]'

export function redactPagePath(path: string): string | null {
  const trimmed = path.trim()

  if (trimmed === '') {
    return null
  }

  const withoutQuery = trimmed.split('?')[0] ?? ''
  const withoutHash = withoutQuery.split('#')[0] ?? ''

  if (withoutHash === '' || !withoutHash.startsWith('/')) {
    return null
  }

  if (withoutHash.startsWith('/complete/')) {
    return COMPLETE_STORED
  }

  if (withoutHash.length > 200) {
    return null
  }

  return withoutHash
}
