import { encodeOverlayText } from "./overlay";

/**
 * The edits a harasser makes to a stolen photo, as Cloudinary transformations on the private asset.
 * Each one is run through the normal check so the vault owner can see Kavach catch it.
 * One effect per component: Cloudinary rejects two `e_` in the same component.
 */
export type Simulation = { kind: string; label: string; transformation: string };

export const SIMULATIONS: readonly Simulation[] = [
  { kind: "mirror", label: "Flipped to dodge reverse search", transformation: "a_hflip" },
  { kind: "crop", label: "Cropped down to the face", transformation: "c_crop,g_face,w_0.7,h_0.7" },
  { kind: "filter", label: "Colour filter applied", transformation: "e_saturation:60/e_hue:15" },
  {
    kind: "caption",
    label: "Abusive caption added",
    transformation: `l_text:Arial_40_bold:${encodeOverlayText("dm for more ;)")},co_white,b_rgb:000000cc,g_south,y_0,w_900,c_fit`,
  },
  { kind: "frame", label: "Screenshot of a chat", transformation: "c_lpad,w_1400,h_1400,b_rgb:f2f2f2" },
  { kind: "recompress", label: "Reposted through WhatsApp", transformation: "q_15" },
];

export function simulationFor(kind: string): Simulation | undefined {
  return SIMULATIONS.find((s) => s.kind === kind);
}
