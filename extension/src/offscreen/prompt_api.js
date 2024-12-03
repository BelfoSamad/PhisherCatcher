let session;

export async function runPrompt(prompt) {
    try {
        if ((!ai || !ai?.languageModel) || (await ai.languageModel.capabilities()).available !== 'readily') {
            return null;
        }

        // Prompt API available
        if (!session) session = await ai.languageModel.create();
        return await session.prompt(prompt);
    } catch (e) {
        console.log("Error occured running prompt: " + e);
        reset();
        return null;
    }
}

async function reset() {
    if (session) session.destroy();
    session = null;
}