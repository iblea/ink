import stringWidth from 'string-width';

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
			// CURSOR_MARKER를 기준으로 split하여 앞부분만 가져오기
			// sliceAnsi는 visible character index를 사용하므로 부적절
			const parts = line.split(CURSOR_MARKER);
			const beforeMarker = parts[0]!; // markerIndex !== -1이므로 항상 존재
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
