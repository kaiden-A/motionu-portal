import Image from 'next/image'

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="page-loader">
      <div className="page-loader__inner">
        <span className="brand-mark">
          <Image src="/icon.png" alt="Motion-U logo" width={1080} height={1080} />
        </span>
        <span className="page-loader__ring" aria-hidden="true" />
        <span className="page-loader__label">{label}</span>
      </div>
    </div>
  )
}
