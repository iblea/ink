import React from 'react';
import {render, useInput, useApp, Box, Text} from '../../src/index.js';

function CliInput() {
	const {exit} = useApp();
	const [inputText, setInputText] = React.useState('');
	const [submittedTexts, setSubmittedTexts] = React.useState<string[]>([]);
	const [cursorPosition, setCursorPosition] = React.useState(0);
	const [, forceUpdate] = React.useReducer(x => x + 1, 0);

	// Use ref to always have the latest inputText value
	const inputTextRef = React.useRef('');
	const cursorPositionRef = React.useRef(0);

	React.useEffect(() => {
		inputTextRef.current = inputText;
		cursorPositionRef.current = cursorPosition;
	}, [inputText, cursorPosition]);

	useInput((input, key) => {

		// Arrow keys - Move cursor position
		if (key.leftArrow) {
			const newPos = Math.max(0, cursorPositionRef.current - 1);
			setCursorPosition(newPos);
			cursorPositionRef.current = newPos; // Update ref immediately
			forceUpdate(); // Force re-render to update terminal cursor
			return;
		}

		if (key.rightArrow) {
			const newPos = Math.min(inputTextRef.current.length, cursorPositionRef.current + 1);
			setCursorPosition(newPos);
			cursorPositionRef.current = newPos; // Update ref immediately
			forceUpdate(); // Force re-render to update terminal cursor
			return;
		}

		// Enter - Print input text.
		if (key.return) {
			// IME FIX: If there's input text with return key (e.g., "요" from "요\r"),
			// "안녕하세요\r(enter)" -> remove "요" ("요" in IME candidate windows), only show "안녕하세".
			// add it to current text before submitting
			let finalText = inputTextRef.current;
			if (input && !input.match(/[\r\n]/)) {
				finalText = finalText + input;
			}

			const trimmedText = finalText.trim();
			if (trimmedText !== '') {
				setSubmittedTexts(prev => [...prev, trimmedText]);
			}
			setInputText('');
			inputTextRef.current = '';
			setCursorPosition(0);
			cursorPositionRef.current = 0;
			return;
		}

		// Backspace - Delete character before cursor
		if (key.backspace) {
			const pos = cursorPositionRef.current;
			if (pos > 0) {
				setInputText(prev => {
					const newText = prev.slice(0, pos - 1) + prev.slice(pos);
					inputTextRef.current = newText;
					return newText;
				});
				const newPos = pos - 1;
				setCursorPosition(newPos);
				cursorPositionRef.current = newPos; // Update ref immediately
			}
			return;
		}

		// Delete - In most terminals, backspace is detected as delete
		// So we treat delete as backspace (delete character before cursor)
		if (key.delete) {
			const pos = cursorPositionRef.current;
			if (pos > 0) {
				setInputText(prev => {
					const newText = prev.slice(0, pos - 1) + prev.slice(pos);
					inputTextRef.current = newText;
					return newText;
				});
				const newPos = pos - 1;
				setCursorPosition(newPos);
				cursorPositionRef.current = newPos; // Update ref immediately
			}
			return;
		}

		// General input - Insert at cursor position
		if (!key.ctrl && !key.meta && input) {
			const pos = cursorPositionRef.current;
			setInputText(prev => {
				const newText = prev.slice(0, pos) + input + prev.slice(pos);
				inputTextRef.current = newText;
				return newText;
			});
			const newPos = pos + input.length;
			setCursorPosition(newPos);
			cursorPositionRef.current = newPos; // Update ref immediately
		}
	});

	return (
		<Box flexDirection="column">
			<Text bold color="cyan">
				=== CLI Input Test Tool ===
			</Text>
			<Text dimColor>
				Type something and press Enter. Press 'q' to exit.
			</Text>
			<Box marginTop={1}>
				<Text terminalCursorFocus color="green">
					{/* &gt; {inputText.slice(0, cursorPosition)}█{inputText.slice(cursorPosition)} */}
					&gt; {inputText.slice(0, cursorPosition)}
				</Text>
			</Box>

			{submittedTexts.length > 0 && (
				<Box flexDirection="column" marginTop={1}>
					<Text bold color="magenta">
						Submitted:
					</Text>
					{submittedTexts.map((text, index) => (
						<Box key={index}>
							<Text color="gray">  [{index + 1}] </Text>
							<Text>{text}</Text>
						</Box>
					))}
				</Box>
			)}
		</Box>
	);
}

render(<CliInput />, {


	// When the enableImeCursor variable is set to false, it operates according to the existing logic.
	// enableImeCursor: false,

	// When the enableImeCursor variable is set to true, it shows the terminal's cursor instead of the cursor rendered by React.
	enableImeCursor: true,


});
