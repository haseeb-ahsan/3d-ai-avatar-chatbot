export const sendTextToGeminiAi = async (userText: string): Promise<string> => {
  const response = await fetch('/api/geminiai', {
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ userText }),
  });
  const { message }: { message: string } = await response.json();
  console.log(message);
  return message;
};
