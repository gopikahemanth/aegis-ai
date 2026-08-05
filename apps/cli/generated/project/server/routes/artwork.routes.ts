import React from 'react';
export interface Artwork { id: string | number; title?: string; imageUrl?: string; price?: number; }
export const artwork.routes: React.FC<any> = (props: any) => <div className="p-4" {...props}>{props?.children || 'artwork.routes'}</div>;
export default artwork.routes;
