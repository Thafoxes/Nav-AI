#!/usr/bin/env python3
import subprocess
import json
import torch
from vosk import Model, KaldiRecognizer, SetLogLevel
from huggingface_hub import hf_hub_download
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

# Set log level to reduce Vosk output
SetLogLevel(0)

# Constants
SAMPLE_RATE = 16000
filepath = "Your mp3 file path here"
HUGGING_FACE_API_KEY = 'Your api here'
huggingface_model = "Your model here"

# Choose device
device = "cuda" if torch.cuda.is_available() else "cpu"

# Initialize Vosk model
print("🎙️ Loading Vosk speech recognition model...")
vosk_model = Model(lang="en-us")
rec = KaldiRecognizer(vosk_model, SAMPLE_RATE)

# Required model files for TinyLlama
required_files = [
    "special_tokens_map.json",
    "generation_config.json",
    "tokenizer_config.json",
    "model.safetensors",
    "eval_results.json",
    "tokenizer.model",
    "tokenizer.json",
    "config.json"
]

# Download model files
print("🔄 Downloading TinyLlama model files...")
for filename in required_files:
    hf_hub_download(
        repo_id=huggingface_model,
        filename=filename,
        token=HUGGING_FACE_API_KEY
    )
print("✅ All model files downloaded.")

# Process the mp3 file with ffmpeg
print(f"🎧 Processing audio file: {filepath}")
with subprocess.Popen(
    ["ffmpeg", "-loglevel", "quiet", "-i", filepath, "-ar", str(SAMPLE_RATE), "-ac", "1", "-f", "s16le", "-"],
    stdout=subprocess.PIPE
) as process:

    # Feed audio data into Vosk recognizer
    while True:
        data = process.stdout.read(4000)
        if len(data) == 0:
            break
        rec.AcceptWaveform(data)

# Final result from Vosk
final_result = json.loads(rec.FinalResult())
transcribed_text = final_result.get("text", "").strip()

print("\n📝 Transcribed Text:")
print(transcribed_text)

# Load TinyLlama model and tokenizer
print("🚀 Loading TinyLlama model...")
model = AutoModelForCausalLM.from_pretrained(huggingface_model, trust_remote_code=True).to(device)
tokenizer = AutoTokenizer.from_pretrained(huggingface_model)

# Create text generation pipeline
text_generation_pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    device=0 if device == "cuda" else -1,
    max_length=1000
)

response = text_generation_pipeline(transcribed_text)
print(response)
print("\n🤖 Response:")
print(response[0]['generated_text'])

