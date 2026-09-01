import { resolveSkin, type CardSkinProps } from '@/lib/card-skins'

export function CredentialCard({
  skin,
  ...props
}: CardSkinProps & { skin?: string | null }) {
  return resolveSkin(skin).render(props)
}
