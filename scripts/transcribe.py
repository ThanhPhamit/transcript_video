import os
import openai
import sys
openai.api_key = os.getenv('OPENAI_API_KEY')
video_id = sys.argv[1]
language = sys.argv[2]
audio_file_path = os.path.join(os.getcwd(), 'tmp', video_id + '.m4a')

output_directory = os.path.join(os.getcwd(), 'output')
output_file_path = os.path.join(output_directory, video_id + '_' + language + '.txt')

audio_file = open(audio_file_path, 'rb')
transcript = openai.audio.transcriptions.create(
    file=audio_file,
    model="whisper-1",
    response_format="srt",
    language=language
)
print(transcript)

# Create the output directory if it doesn't exist
if not os.path.exists(output_directory):
    os.makedirs(output_directory)

with open(output_file_path, "w") as f:
    # Write transcript to the file
    f.write(transcript)
    f.close()