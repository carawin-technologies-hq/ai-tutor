/** Shared settings for the natural (Piper, on-device) teacher voice. Safe to import on the page. */

export interface NaturalVoice { id: string; label: string; note: string; mb: number }
/** Piper voices from rhasspy/piper (MIT), served from Hugging Face. Sizes are approximate. */
export const NATURAL_VOICES: NaturalVoice[] = [
  { id: "en_GB-jenny_dioco-medium", label: "Jenny", note: "Warm female, British English", mb: 63 },
  { id: "en_GB-cori-high", label: "Cori", note: "Clear female, British English (best quality)", mb: 114 },
  { id: "en_US-lessac-high", label: "Lessac", note: "Calm female, American English (best quality)", mb: 114 },
  { id: "en_US-amy-medium", label: "Amy", note: "Friendly female, American English", mb: 63 },
  { id: "en_US-kusal-medium", label: "Kusal", note: "Male, Indian-accented English", mb: 63 },
];

/** Whether a voice's model is already saved in this browser (the Piper library stores it in OPFS under "piper/"). */
export async function isVoiceDownloaded(voiceId: string): Promise<boolean> {
  try {
    const dir = await (await navigator.storage.getDirectory()).getDirectoryHandle("piper");
    const file = await (await dir.getFileHandle(`${voiceId}.onnx`)).getFile();
    return file.size > 1_000_000;
  } catch { return false; }
}
