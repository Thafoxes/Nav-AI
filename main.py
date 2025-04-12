from huggingface_hub import hf_hub_download
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"


HUGGING_FACE_API_KEY = 'Your api here'

huggingface_model = "Your model here"

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

print("🔄 Downloading model files...")
for filename in required_files:
    download_location = hf_hub_download(
        repo_id=huggingface_model,
        filename=filename,
        token=HUGGING_FACE_API_KEY
    )
    print(f"✅ Downloaded: {filename}")

print("🚀 Loading model and tokenizer...")

model = AutoModelForCausalLM.from_pretrained(huggingface_model, trust_remote_code=True).to(device)

tokenizer = AutoTokenizer.from_pretrained(huggingface_model)

text_generation_pipeline = pipeline(
    "text-generation",
    model=model,
    tokenizer=tokenizer,
    device=0 if device == "cuda" else -1,
    max_length=1000
)

response = text_generation_pipeline("how to make a sandwich")
print(response)
