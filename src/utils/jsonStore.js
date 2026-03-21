const fs = require('fs/promises');
const path = require('path');

function getAbsolutePath(relativePath) {
  return path.join(process.cwd(), relativePath);
}

async function readJsonFile(relativePath) {
  const absolutePath = getAbsolutePath(relativePath);

  try {
    const content = await fs.readFile(absolutePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function writeJsonFile(relativePath, data) {
  const absolutePath = getAbsolutePath(relativePath);
  const content = JSON.stringify(data, null, 2);

  await fs.writeFile(absolutePath, `${content}\n`, 'utf8');
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
