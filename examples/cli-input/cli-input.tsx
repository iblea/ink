import React from 'react';
import {render, useInput, useApp, Box, Text} from '../../src/index.js';

function CliInput() {
	const {exit} = useApp();
	const [inputText, setInputText] = React.useState('');
	const [submittedTexts, setSubmittedTexts] = React.useState<string[]>([]);

	// Use ref to always have the latest inputText value
	const inputTextRef = React.useRef('');

	React.useEffect(() => {
		inputTextRef.current = inputText;
	}, [inputText]);

	useInput((input, key) => {

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
			return;
		}

		// Backspace
		if (key.backspace || key.delete) {
			setInputText(prev => {
				const newText = prev.slice(0, -1);
				inputTextRef.current = newText;
				return newText;
			});
			return;
		}

		// General input
		if (!key.ctrl && !key.meta && input) {
			setInputText(prev => {
				const newText = prev + input;
				inputTextRef.current = newText;
				return newText;
			});
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
				<Text color="green">&gt; {inputText}█</Text>
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
