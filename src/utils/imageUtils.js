// src/utils/imageUtils.js

export async function downscaleDataUrl(dataUrl, maxWidth = 512, quality = 0.8) {
	return new Promise((resolve, reject) => {
		try {
			const img = new Image();
			img.onload = () => {
				const scale = Math.min(1, maxWidth / img.naturalWidth || maxWidth / img.width || 1);
				const targetW = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
				const targetH = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
				const canvas = document.createElement('canvas');
				canvas.width = targetW;
				canvas.height = targetH;
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, targetW, targetH);
				// Use webp for smaller size if supported
				const out = canvas.toDataURL('image/webp', quality);
				resolve(out);
			};
			img.onerror = reject;
			img.src = dataUrl;
		} catch (err) {
			reject(err);
		}
	});
} 