
export async function getClipTranscript( transcriptId, startMs, endMs, clients, loggers ) {
    try {
        const { databases, storage, config } = clients;
        const { log, error } = loggers;

        const transcriptFile = await storage.getFileDow

    } catch (err) {
        log.error(err);
        error(err);
        throw err;
    }
}