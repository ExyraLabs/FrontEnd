/* eslint-disable @next/next/no-img-element */
import React from 'react';

// Simple mock that renders a regular img with forwarded props
export default function NextImage({ src, alt = '', width, height, fill, ...props }) {
	const style = fill ? { position: 'relative', width: '100%', height: '100%' } : undefined;
	const resolvedSrc = typeof src === 'string' ? src : (src?.src ?? '');
	return (
		<img src={resolvedSrc} alt={alt} width={width} height={height} style={style} {...props} />
	);
}

