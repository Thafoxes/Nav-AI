#!/usr/bin/env python3

import argparse
import queue
import sys
import sounddevice as sd
import threading
import time
import keyboard
from vosk import Model, KaldiRecognizer

q = queue.Queue()
recording_event = threading.Event()
silence_timeout = 5  # seconds
output_filename = "recognized_text.txt"

def int_or_str(text):
    try:
        return int(text)
    except ValueError:
        return text

def callback(indata, frames, time_, status):
    if status:
        print(status, file=sys.stderr)
    q.put(bytes(indata))

def listen_and_transcribe(model, samplerate, device):
    rec = KaldiRecognizer(model, samplerate)
    last_audio_time = time.time()

    with sd.RawInputStream(samplerate=samplerate, blocksize=8000, device=device,
                           dtype="int16", channels=1, callback=callback):
        print("Say something...")

        while True:
            try:
                data = q.get(timeout=1)
                if rec.AcceptWaveform(data):
                    result = rec.Result()
                    break
                else:
                    print(rec.PartialResult(), end='\r')
                last_audio_time = time.time()
            except queue.Empty:
                if time.time() - last_audio_time > silence_timeout:
                    print("\nNo voice detected. Exiting.")
                    return None

    text = eval(result)["text"]
    with open(output_filename, "w") as f:
        f.write(text)

    print(f"\nYou said: \"{text}\"")
    return text

def main():
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("-l", "--list-devices", action="store_true", help="show list of audio devices and exit")
    args, remaining = parser.parse_known_args()

    if args.list_devices:
        print(sd.query_devices())
        parser.exit(0)

    parser = argparse.ArgumentParser(parents=[parser])
    parser.add_argument("-d", "--device", type=int_or_str, help="input device (numeric ID or substring)")
    parser.add_argument("-r", "--samplerate", type=int, help="sampling rate")
    parser.add_argument("-m", "--model", type=str, help="language model (e.g. en-us, fr, nl)")
    args = parser.parse_args(remaining)

    try:
        if args.samplerate is None:
            device_info = sd.query_devices(args.device, "input")
            args.samplerate = int(device_info["default_samplerate"])

        model = Model(lang=args.model or "en-us")

        print("Press 's' to start listening...")
        while True:
            keyboard.wait('s' or 'n')
            text = listen_and_transcribe(model, args.samplerate, args.device)

            if text:
                print("Is this what you said? (y/n)")
                while True:
                    if keyboard.is_pressed('y'):
                        print("Confirmed.")
                        return
                    elif keyboard.is_pressed('n'):
                        print("Retrying... Press 's' to start listening again.")
                        break

    except KeyboardInterrupt:
        print("\nInterrupted by user")
    except Exception as e:
        parser.exit(f"{type(e).__name__}: {e}")

if __name__ == "__main__":
    main()
