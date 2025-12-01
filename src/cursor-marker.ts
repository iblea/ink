import stringWidth from 'string-width';

/**
 * Cursor marker character
 * Used to find and calculate cursor position in the rendered output.
 */
export const CURSOR_MARKER = '█';

/**
 * Finds cursor position in the rendered output.
 * @param output Rendered output string
 * @returns {row, col} Row and column position of cursor (0-based), null if not found
 */
export function findCursorPosition(output: string): {row: number; col: number} | null {
	const lines = output.split('\n');

	for (let row = 0; row < lines.length; row++) {
		const line = lines[row];

		if (!line) {
			continue;
		}

		const markerIndex = line.indexOf(CURSOR_MARKER);

		if (markerIndex !== -1) {
			// Split by CURSOR_MARKER and get only the part before it
			// sliceAnsi is inappropriate as it uses visible character index
			const parts = line.split(CURSOR_MARKER);
			const beforeMarker = parts[0]!; // Always exists since markerIndex !== -1
			const col = stringWidth(beforeMarker);

			return {row, col};
		}
	}

	return null;
}

/**
 * Removes cursor marker from the output.
 * @param output Rendered output string
 * @returns Output string with cursor marker removed
 */
export function removeCursorMarker(output: string): string {
	return output.replaceAll(CURSOR_MARKER, '');
}
