import React from 'react';
export const Card: React.FC<any> = (props) => <div className="p-4 border rounded shadow" {...props}>{props.title || 'Card'}</div>;
export default Card;
