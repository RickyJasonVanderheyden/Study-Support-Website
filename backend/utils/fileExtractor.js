const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

let officeTextExtractorModulePromise;

async function loadOfficeTextExtractor() {
  if (!officeTextExtractorModulePromise) {
    officeTextExtractorModulePromise = import('office-text-extractor');
  }

  return officeTextExtractorModulePromise;
}

/**
 * Extract text from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    // Clean up the extracted text
    let text = data.text
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n\n')  // Normalize line breaks
      .trim();
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from a DOCX file
 * @param {string} filePath - Path to the DOCX file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromDOCX(filePath) {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('No text content found in document');
    }
    
    return result.value.trim();
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error(`Failed to extract text from document: ${error.message}`);
  }
}

/**
 * Extract text from a TXT file
 * @param {string} filePath - Path to the TXT file
 * @returns {Promise<string>} - File content
 */
async function extractTextFromTXT(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!content || content.trim().length === 0) {
      throw new Error('No text content found in file');
    }
    
    return content.trim();
  } catch (error) {
    console.error('Error reading text file:', error);
    throw new Error(`Failed to read text file: ${error.message}`);
  }
}

/**
 * Extract text from a PowerPoint file (.pptx, .ppt)
 * @param {string} filePath - Path to the PowerPoint file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPPTX(filePath) {
  try {
    const { getTextExtractor } = await loadOfficeTextExtractor();
    const extractor = getTextExtractor();
    const text = await extractor.extractText({ input: filePath, type: 'file' });
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in PowerPoint');
    }
    
    // Clean up the extracted text
    let cleanedText = text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
    
    return cleanedText;
  } catch (error) {
    console.error('Error extracting text from PowerPoint:', error);
    throw new Error(`Failed to extract text from PowerPoint: ${error.message}`);
  }
}

/**
 * Extract text from a file based on its extension
 * @param {string} filePath - Path to the file
 * @param {string} originalName - Original file name with extension
 * @returns {Promise<string>} - Extracted text content
 */
async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  
  switch (ext) {
    case '.pdf':
      return extractTextFromPDF(filePath);
    case '.docx':
    case '.doc':
      return extractTextFromDOCX(filePath);
    case '.pptx':
      return extractTextFromPPTX(filePath);
    case '.ppt':
      throw new Error('Legacy .ppt format is not supported. Please convert to .pptx (PowerPoint 2007 or later)');
    case '.txt':
      return extractTextFromTXT(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext}. Supported types: .pdf, .docx, .pptx, .txt`);
  }
}

/**
 * Delete a temporary file
 * @param {string} filePath - Path to the file to delete
 */
function deleteTempFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting temp file:', error);
  }
}

module.exports = {
  extractText,
  extractTextFromPDF,
  extractTextFromDOCX,
  extractTextFromPPTX,
  extractTextFromTXT,
  deleteTempFile
};
