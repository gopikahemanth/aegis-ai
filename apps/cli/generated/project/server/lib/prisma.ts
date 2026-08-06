import React from 'react';
export interface Artwork { id: string | number; title?: string; imageUrl?: string; price?: number; }
export const prisma: React.FC<any> = (props: any) => <div className="p-4" {...props}>{props?.children || 'prisma'}</div>;
export default prisma;
