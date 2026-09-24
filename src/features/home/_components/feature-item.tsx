import type { Feature } from '../types/home'

/**
 * FeatureItem — one entry in the feature-icons strip (shipping, returns, etc).
 * @param icon - lucide icon component to render
 * @param label - short feature name
 * @param description - one-line supporting detail
 */
export const FeatureItem = ({ icon: Icon, label, description }: Feature) => (
  <div className="flex items-center gap-3">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Icon className="size-5" />
    </span>
    <div className="min-w-0">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="truncate text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
)
