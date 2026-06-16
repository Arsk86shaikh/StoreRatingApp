export const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatRole = (role) => {
  const map = {
    admin: 'Admin',
    user: 'User',
    store_owner: 'Store Owner',
  }
  return map[role] || role
}

export const formatRating = (rating) => {
  if (rating === null || rating === undefined || rating === 0) return 'No ratings yet'
  return Number(rating).toFixed(1)
}

export const truncate = (text, length = 50) => {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length)}...` : text
}