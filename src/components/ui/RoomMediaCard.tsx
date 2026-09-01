import type { ReactNode } from 'react'

type RoomMediaCardProps = {
  name: string
  description: string
  imageUrl?: string | null
  badge?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

export function RoomMediaCard({ name, description, imageUrl, badge, children, footer }: RoomMediaCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-border-subtle bg-white shadow-card">
      <div
        className="h-[210px] bg-[linear-gradient(135deg,#d4c29c,#f1ece3_45%,#355069)] bg-cover bg-center md:h-[310px]"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      />
      <div className="p-4 md:p-6">
        {badge && <div className="float-right">{badge}</div>}
        <h3 className="my-3 font-display text-[29px] font-medium">{name}</h3>
        <p className="min-h-[34px] text-xs text-muted">{description}</p>
        {children}
        {footer && <div className="mt-[18px] flex items-center justify-between">{footer}</div>}
      </div>
    </article>
  )
}
