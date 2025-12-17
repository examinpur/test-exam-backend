import fs from 'fs';
import path from 'path';

export const parseQuestionFile = async (filePath: string): Promise<any[]> => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.json') {
    return parseJsonFile(filePath);
  }

  if (ext === '.txt') {
    return parseTxtFile(filePath);
  }

  if (ext === '.docx' || ext === '.doc') {
    throw new Error('DOCX/DOC parsing requires additional setup. Please use JSON format.');
  }

  throw new Error(`Unsupported file format: ${ext}`);
};

const parseJsonFile = async (filePath: string): Promise<any[]> => {
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);

  if (!Array.isArray(data)) {
    throw new Error('JSON file must contain an array');
  }

  return data;
};

const parseTxtFile = async (filePath: string): Promise<any[]> => {
  const content = fs.readFileSync(filePath, 'utf-8');

  try {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) {
      throw new Error('TXT file must contain a JSON array');
    }
    return data;
  } catch {
    throw new Error('TXT file must contain valid JSON array');
  }
};

export const cleanupFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
};

