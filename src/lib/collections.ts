export function uniqueBy<T, Key>(items: T[], getKey: (item: T) => Key): T[] {
  const seen = new Set<Key>()
  return items.filter((item) => {
    const key = getKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
