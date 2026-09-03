export function initialsFor(name?: string | null): string {
  if (!name) return 'MU'
  const parts = name.split(/\s+/).filter(Boolean)
  if (!parts.length) return 'MU'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Member avatar — shows the Google profile photo when the member has one,
 *  and falls back to the initials chip otherwise. Sizing/shape comes from
 *  the caller's className (mini-avatar, member-row__avatar, ...). */
export function Avatar({
  name,
  initials,
  avatarUrl,
  dept,
  className = 'mini-avatar',
}: {
  name?: string | null
  initials?: string | null
  avatarUrl?: string | null
  dept?: string | null
  className?: string
}) {
  if (avatarUrl) {
    return (
      <div className={`${className} avatar`} data-dept={dept ?? ''}>
        <img
          className="avatar-img"
          src={avatarUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }
  return (
    <div className={className} data-dept={dept ?? ''}>
      {initials || initialsFor(name)}
    </div>
  )
}
