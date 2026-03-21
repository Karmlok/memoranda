const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const uploadsDir = path.join(process.cwd(), 'uploads');
const supportedTypes = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

async function saveBase64Image(imageData, imageName = 'image') {
  if (!imageData) {
    return null;
  }

  const match = imageData.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Formato immagine non valido.');
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2];
  const extension = supportedTypes[mimeType];

  if (!extension) {
    throw new Error('Tipo immagine non supportato. Usa PNG, JPG, WEBP o GIF.');
  }

  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = String(imageName || 'image')
    .replace(/[^a-z0-9_-]/gi, '-')
    .toLowerCase()
    .slice(0, 40)
    || 'image';

  const filename = `${Date.now()}-${safeName}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  const filePath = path.join(uploadsDir, filename);

  await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
  return `/uploads/${filename}`;
}

module.exports = {
  saveBase64Image,
};
