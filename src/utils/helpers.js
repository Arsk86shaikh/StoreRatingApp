export const sortData = (data, key, order = 'asc') => {
  if (!key) return data
  return [...data].sort((a, b) => {
    let valA = a[key]
    let valB = b[key]

    if (typeof valA === 'string') valA = valA.toLowerCase()
    if (typeof valB === 'string') valB = valB.toLowerCase()

    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1

    if (valA < valB) return order === 'asc' ? -1 : 1
    if (valA > valB) return order === 'asc' ? 1 : -1
    return 0
  })
}

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('')
}

export const classNames = (...classes) => classes.filter(Boolean).join(' ')