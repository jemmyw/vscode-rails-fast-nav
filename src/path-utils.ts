import * as path from 'path';

/**
 * Given a path like '/path/to/something.ext' and an append string '_extra',
 * returns '/path/to/something_extra.ext'
 */
export function appendWithoutExt(filename: string, append: string): string {
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  return path.join(path.dirname(filename), basename + append + ext);
}
