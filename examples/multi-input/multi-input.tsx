import React, {useState} from 'react';
import {render, Text, Box, useInput} from '../../src/index.js';

let messageId = 0;

function ChatApp() {
	const [input, setInput] = useState('');
	const [name, setName] = useState('');
	const [activeField, setActiveField] = useState<'input' | 'name'>('input');

	const [messages, setMessages] = useState<
		Array<{
			id: number;
			text: string;
		}>
	>([]);

	useInput((character, key) => {
		// Tab 키로 focus 전환
		if (key.tab) {
			setActiveField(current => current === 'input' ? 'name' : 'input');
			return;
		}

		if (key.return) {
			if (activeField === 'input' && input) {
				setMessages(previousMessages => [
					...previousMessages,
					{
						id: messageId++,
						text: `User: ${input}`,
					},
				]);
				setInput('');
			} else if (activeField === 'name' && name) {
				setMessages(previousMessages => [
					...previousMessages,
					{
						id: messageId++,
						text: `Name: ${name}`,
					},
				]);
				setName('');
			}
		} else if (key.backspace || key.delete) {
			// activeField에 따라 입력 처리
			if (activeField === 'input') {
				setInput(currentInput => currentInput.slice(0, -1));
			} else {
				setName(currentName => currentName.slice(0, -1));
			}
		} else if (character) {
			// activeField에 따라 입력 처리
			if (activeField === 'input') {
				setInput(currentInput => currentInput + character);
			} else {
				setName(currentName => currentName + character);
			}
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			<Text bold color="cyan">
				=== Tab Focus Test (Press Tab to switch) ===
			</Text>

			<Box flexDirection="column" marginTop={1}>
				{messages.map(message => (
					<Text key={message.id}>{message.text}</Text>
				))}
			</Box>

			<Box marginTop={1}>
				<Text terminalCursorFocus={activeField === 'input'} color={activeField === 'input' ? 'green' : 'white'}>
					Enter your message: {input}
				</Text>
			</Box>
			<Box marginTop={1}>
				<Text terminalCursorFocus={activeField === 'name'} color={activeField === 'name' ? 'green' : 'white'}>
					Enter your name: {name}
				</Text>
			</Box>

		</Box>
	);
}

render(<ChatApp />, {
	enableImeCursor: true,
});
