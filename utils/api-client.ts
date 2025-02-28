export function extractVideoIdFromUrl(url: string) {
  return new URL(url).searchParams.get('v')
}

type ProgressCallback = (output: string) => void

export async function processVideo(
  videoId: string,
  callback: ProgressCallback
): Promise<false | string> {
  callback('Downloading audio...\n')
  await downloadAudio(videoId, callback)

  callback('\nTranscribing audio English subtitle. It takes a while...\n')
  const srt_en = await transcribe(videoId, "en", callback)

  callback('\nTranslatting to Japanese. It takes a while...\n')
  const srt_ja = await transcribe(videoId, "ja", callback)

  callback('\nTranslatting to French. It takes a while...\n')
  const srt_fe = await transcribe(videoId, "fr", callback)

  callback('\nTranslatting to Russian. It takes a while...\n')
  const srt_ru = await transcribe(videoId, "ru", callback)

  callback('\nTranslatting to German. It takes a while...\n')
  const srt_de = await transcribe(videoId, "de", callback)

  callback('\nTranslatting to Korean. It takes a while...\n')
  const srt_ko = await transcribe(videoId, "ko", callback)

  callback('\nTranslatting to Spanish. It takes a while...\n')
  const srt_es = await transcribe(videoId, "es", callback)

  if (srt_en) {
    callback('\nTranslating text...\n')
    const result = await translate(srt_en, callback)
    callback('\nDone!\n')
    return result
  }

  return false
}

export async function downloadAudio(
  videoId: string,
  onProgress: ProgressCallback
) {
  const res = await fetch(
    `/api/audio?${new URLSearchParams({ video_id: videoId })}`,
    {}
  )
  const reader = res.body?.getReader()

  if (reader) {
    return streamResponse(reader, onProgress)
  } else {
    return false
  }
}

export async function transcribe(
  videoId: string,
  language: string,
  onProgress: ProgressCallback
): Promise<string | false> {
  const res = await fetch(
    `/api/transcript?${new URLSearchParams({ video_id: videoId, language: language })}`,
    {}
  )
  const reader = res.body?.getReader()

  if (reader) {
    return streamResponse(reader, onProgress)
  } else {
    return false
  }
}

export async function translate(srtData: string, onProgress: ProgressCallback) {
  const res = await fetch(`/api/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    },
    body: srtData
  })
  const reader = res.body?.getReader()

  if (reader) {
    const result = await streamResponse(reader, onProgress)
    return result
      .split('\n')
      .filter(line => {
        return !line.startsWith('[Error]')
      })
      .join('\n')
  } else {
    return false
  }
}

async function streamResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onProgress: ProgressCallback
): Promise<string> {
  return await new Promise(resolve => {
    const decoder = new TextDecoder()
    let result = ''
    const readChunk = ({
      done,
      value
    }: ReadableStreamReadResult<Uint8Array>) => {
      if (done) {
        resolve(result)
        return
      }

      const output = decoder.decode(value)
      result += output
      onProgress(output)
      reader.read().then(readChunk)
    }

    reader.read().then(readChunk)
  })
}
