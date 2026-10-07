import { BrandMark } from './brand-logo'

export function FullPageLoader() {
  return (
    <div className="grid min-h-svh place-items-center">
      <BrandMark className="size-10 animate-pulse" />
    </div>
  )
}
