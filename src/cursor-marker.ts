import stringWidth from 'string-width';
import sliceAnsi from 'slice-ansi';

/**
 * 커서 마커 문자
 * 렌더링된 출력에서 이 문자를 찾아 커서 위치를 계산합니다.
 */
export const CURSOR_MARKER = '█';

/**
 * 렌더링된 출력에서 커서 위치를 찾습니다.
 * @param output 렌더링된 출력 문자열
 * @returns {row, col} 커서의 행과 열 위치 (0-based), 찾지 못하면 null
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
			// ANSI 이스케이프 코드를 고려하여 실제 화면상의 열 위치 계산
			const beforeMarker = sliceAnsi(line, 0, markerIndex);
			const col = stringWidth(beforeMarker);

			return {row, col};
		}
	}

	return null;
}

/**
 * 출력에서 커서 마커를 제거합니다.
 * @param output 렌더링된 출력 문자열
 * @returns 커서 마커가 제거된 출력 문자열
 */
export function removeCursorMarker(output: string): string {
	return output.replaceAll(CURSOR_MARKER, '');
}
