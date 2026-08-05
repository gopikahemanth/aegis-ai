export interface Artwork { id: string | number; title?: string; name?: string; email?: string; imageUrl?: string; price?: number; artist?: any; category?: any; medium?: string; createdAt?: string; updatedAt?: string; }
export type ArtworkInput = Partial<Artwork>;
export default Artwork;
