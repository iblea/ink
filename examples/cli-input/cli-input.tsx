import React from 'react';
import {render, useInput, useApp, Box, Text} from '../../src/index.js';

function CliInput() {
	const {exit} = useApp();
	const [inputText, setInputText] = React.useState('');
	const [submittedTexts, setSubmittedTexts] = React.useState<string[]>([]);

	useInput((input, key) => {

		// Enter - Print input text.
		if (key.return) {
			if (inputText.trim() !== '') {
				setSubmittedTexts(prev => [...prev, inputText]);
				setInputText('');
			}
			return;
		}

		// Backspace
		if (key.backspace || key.delete) {
			setInputText(prev => prev.slice(0, -1));
			return;
		}

		// General input
		if (!key.ctrl && !key.meta && input) {
			setInputText(prev => prev + input);
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
