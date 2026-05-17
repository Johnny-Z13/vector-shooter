export interface ArtifactArchiveCard<T> {
  record: T
  locked: boolean
}

export const orderArtifactArchiveCards = <T>(cards: Array<ArtifactArchiveCard<T>>) => (
  [...cards].sort((a, b) => Number(a.locked) - Number(b.locked))
)
