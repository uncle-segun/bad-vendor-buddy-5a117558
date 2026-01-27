/**
 * Sanitizes user input for use in PostgREST filter queries.
 * Escapes special characters that could be used for filter injection.
 */
export function sanitizePostgrestQuery(input: string): string {
  // Remove or escape PostgREST special characters
  // These characters have special meaning in PostgREST filter syntax
  const specialChars = /[,(){}."\\]/g;
  
  // Replace special characters with escaped versions or remove them
  return input
    .replace(specialChars, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 100); // Limit length to prevent abuse
}

/**
 * Validates that a search query doesn't contain suspicious patterns.
 */
export function isValidSearchQuery(input: string): boolean {
  if (!input || input.length === 0) return false;
  if (input.length > 100) return false;
  
  // Check for SQL injection patterns
  const suspiciousPatterns = [
    /--/,           // SQL comment
    /;/,            // Statement terminator
    /'/,            // Single quote
    /\\x[0-9a-f]/i, // Hex escape
    /\bor\b.*=/i,   // OR condition
    /\band\b.*=/i,  // AND condition
    /\bunion\b/i,   // UNION
    /\bselect\b/i,  // SELECT
    /\bdrop\b/i,    // DROP
    /\bdelete\b/i,  // DELETE
    /\binsert\b/i,  // INSERT
    /\bupdate\b/i,  // UPDATE
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(input));
}
