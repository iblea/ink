import {type Writable} from 'node:stream';
import ansiEscapes from 'ansi-escapes';
import cliCursor from 'cli-cursor';
import {findCursorPosition, CURSOR_MARKER} from './cursor-marker.js';

export type LogUpdate = {
	clear: () => void;
	done: () => void;
	sync: (str: string) => void;
	(str: string): void;
};

const createStandard = (
	stream: Writable,
	{showCursor = false, enableImeCursor = false} = {},
): LogUpdate => {
	let previousLineCount = 0;
	let previousOutput = '';
	let hasHiddenCursor = false;
	let isFirstRender = true;

	const render = (str: string) => {
		// When IME cursor mode is enabled
		if (enableImeCursor) {
			const cursorPos = findCursorPosition(str);

			// Important: Remove cursor marker from output string
			const cleanStr = str.replaceAll(CURSOR_MARKER, '');
			const cleanOutput = cleanStr + '\n';


			// Line count calculation should use original (including cursor marker) for accuracy
			const originalOutput = str + '\n';

			if (cleanOutput === previousOutput) {
				return;
			}

			previousOutput = cleanOutput;

			// Restore cursor -> Erase previous output -> New output -> Save cursor -> Move cursor
			const lineCount = originalOutput.split('\n').length;
			let buffer = '';

			// Show cursor on first render
			if (isFirstRender) {
				buffer += ansiEscapes.cursorShow;
				isFirstRender = false;
			}

			// If there is previous output, restore cursor and erase
			if (previousLineCount > 0) {
				buffer += ansiEscapes.cursorRestorePosition;
				buffer += ansiEscapes.eraseLines(previousLineCount);
			}

			// Clean output with cursor marker removed
			buffer += cleanOutput;
			buffer += ansiEscapes.cursorSavePosition;

			// Only move terminal cursor position (do not show/hide!)
			if (cursorPos) {
				const moveUp = lineCount - cursorPos.row - 1;
				buffer += (moveUp > 0 ? ansiEscapes.cursorUp(moveUp) : '');
				buffer += ansiEscapes.cursorTo(cursorPos.col);
			}

			stream.write(buffer);
			previousLineCount = lineCount;
			return;
		}

		// Original behavior (hide cursor) - not executed in enableImeCursor mode!
		if (!showCursor && !hasHiddenCursor && !enableImeCursor) {
			cliCursor.hide(stream);
			hasHiddenCursor = true;
		}

		const output = str + '\n';
		if (output === previousOutput) {
			return;
		}

		previousOutput = output;
		stream.write(ansiEscapes.eraseLines(previousLineCount) + output);
		previousLineCount = output.split('\n').length;
	};

	render.clear = () => {
		stream.write(ansiEscapes.eraseLines(previousLineCount));
		previousOutput = '';
		previousLineCount = 0;
	};

	render.done = () => {
		previousOutput = '';
		previousLineCount = 0;

		if (enableImeCursor) {
			// In IME cursor mode, hide as original
			stream.write(ansiEscapes.cursorHide);
		} else if (!showCursor) {
			cliCursor.show(stream);
			hasHiddenCursor = false;
		}
	};

	render.sync = (str: string) => {
		const output = str + '\n';
		previousOutput = output;
		previousLineCount = output.split('\n').length;
	};

	return render;
};

const createIncremental = (
	stream: Writable,
	{showCursor = false, enableImeCursor = false} = {},
): LogUpdate => {
	let previousLines: string[] = [];
	let previousOutput = '';
	let hasHiddenCursor = false;

	// IME cursor mode: Show terminal cursor once during initialization
	if (enableImeCursor) {
		cliCursor.show(stream);
	}

	const render = (str: string) => {
		// When IME cursor mode is enabled
		if (enableImeCursor) {
			const cursorPos = findCursorPosition(str);

			// Important: Remove cursor marker from output string
			const cleanStr = str.replaceAll(CURSOR_MARKER, '');
			const cleanOutput = cleanStr + '\n';

			// Line count calculation uses original (including cursor marker)
			const originalOutput = str + '\n';

			if (cleanOutput === previousOutput) {
				return;
			}

			const previousCount = previousLines.length;
			const cleanLines = cleanOutput.split('\n');
			const originalLines = originalOutput.split('\n');
			const nextCount = originalLines.length;
			const visibleCount = nextCount - 1;

			let buffer = '';

			if (cleanOutput === '\n' || previousOutput.length === 0) {
				// First rendering
				buffer += cleanOutput;
				buffer += ansiEscapes.cursorSavePosition;

				// Only move terminal cursor position (do not show/hide!)
				if (cursorPos) {
					const moveUp = visibleCount - cursorPos.row;
					buffer += (moveUp > 0 ? ansiEscapes.cursorUp(moveUp) : '');
					buffer += ansiEscapes.cursorTo(cursorPos.col);
				}

				stream.write(buffer);
				previousOutput = cleanOutput;
				previousLines = cleanLines;
				return;
			}

			// Incremental rendering after cursor restore
			buffer += ansiEscapes.cursorRestorePosition;

			if (nextCount < previousCount) {
				buffer += ansiEscapes.eraseLines(previousCount - nextCount + 1);
				buffer += ansiEscapes.cursorUp(visibleCount);
			} else {
				buffer += ansiEscapes.cursorUp(previousCount - 1);
			}

			for (let i = 0; i < visibleCount; i++) {
				if (cleanLines[i] === previousLines[i]) {
					buffer += ansiEscapes.cursorNextLine;
					continue;
				}

				buffer += ansiEscapes.eraseLine + cleanLines[i] + '\n';
			}

			buffer += ansiEscapes.cursorSavePosition;

			// Only move terminal cursor position (do not show/hide!)
			if (cursorPos) {
				const moveUp = visibleCount - cursorPos.row;
				buffer += (moveUp > 0 ? ansiEscapes.cursorUp(moveUp) : '');
				buffer += ansiEscapes.cursorTo(cursorPos.col);
			}

			stream.write(buffer);
			previousOutput = cleanOutput;
			previousLines = cleanLines;
			return;
		}

		// Original behavior (hide cursor) - not executed in enableImeCursor mode!
		if (!showCursor && !hasHiddenCursor && !enableImeCursor) {
			cliCursor.hide(stream);
			hasHiddenCursor = true;
		}

		const output = str + '\n';
		if (output === previousOutput) {
			return;
		}

		const previousCount = previousLines.length;
		const nextLines = output.split('\n');
		const nextCount = nextLines.length;
		const visibleCount = nextCount - 1;

		if (output === '\n' || previousOutput.length === 0) {
			stream.write(ansiEscapes.eraseLines(previousCount) + output);
			previousOutput = output;
			previousLines = nextLines;
			return;
		}

		// We aggregate all chunks for incremental rendering into a buffer, and then write them to stdout at the end.
		const buffer: string[] = [];

		// Clear extra lines if the current content's line count is lower than the previous.
		if (nextCount < previousCount) {
			buffer.push(
				// Erases the trailing lines and the final newline slot.
				ansiEscapes.eraseLines(previousCount - nextCount + 1),
				// Positions cursor to the top of the rendered output.
				ansiEscapes.cursorUp(visibleCount),
			);
		} else {
			buffer.push(ansiEscapes.cursorUp(previousCount - 1));
		}

		for (let i = 0; i < visibleCount; i++) {
			// We do not write lines if the contents are the same. This prevents flickering during renders.
			if (nextLines[i] === previousLines[i]) {
				buffer.push(ansiEscapes.cursorNextLine);
				continue;
			}

			buffer.push(ansiEscapes.eraseLine + nextLines[i] + '\n');
		}

		stream.write(buffer.join(''));

		previousOutput = output;
		previousLines = nextLines;
	};

	render.clear = () => {
		stream.write(ansiEscapes.eraseLines(previousLines.length));
		previousOutput = '';
		previousLines = [];
	};

	render.done = () => {
		previousOutput = '';
		previousLines = [];

		if (enableImeCursor) {
			// In IME cursor mode, hide as original
			cliCursor.hide(stream);
		} else if (!showCursor) {
			cliCursor.show(stream);
			hasHiddenCursor = false;
		}
	};

	render.sync = (str: string) => {
		const output = str + '\n';
		previousOutput = output;
		previousLines = output.split('\n');
	};

	return render;
};

const create = (
	stream: Writable,
	{showCursor = false, incremental = false, enableImeCursor = false} = {},
): LogUpdate => {
	if (incremental) {
		return createIncremental(stream, {showCursor, enableImeCursor});
	}

	return createStandard(stream, {showCursor, enableImeCursor});
};

const logUpdate = {create};
export default logUpdate;
