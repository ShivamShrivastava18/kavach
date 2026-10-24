import type { Verdict } from "./match";

export type CaseFacts = {
  caseId: string;
  victimName: string;
  platform: string;
  postUrl?: string;
  firstSeen: string;
  exhibitSha256: string;
  verdict: Verdict;
  score: number;
  methods: string[];
  matchedPhotoDate?: string;
  explicit: boolean;
};

export const VERIFY_LINE = "Verify section numbers with the portal or a lawyer before filing.";

function pct(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function derivation(f: CaseFacts): string {
  const methods = f.methods.length ? ` (methods: ${f.methods.join(", ")})` : "";
  switch (f.verdict) {
    case "derived":
      return `Perceptual fingerprint comparison shows the image was made from my own photograph, registered with Kavach on ${f.matchedPhotoDate}, with ${pct(f.score)} similarity${methods}. The image was altered without my consent.`;
    case "likely":
      return `Perceptual fingerprint comparison indicates the image was likely derived from my own photograph registered on ${f.matchedPhotoDate ?? "record"}, with ${pct(f.score)} similarity${methods}. The image was altered and published without my consent.`;
    default:
      return `Kavach found that no registered photo matched this image; this complaint rests on identity and consent: the image depicts me, and I did not consent to its creation or publication.`;
  }
}

function sections(f: CaseFacts): string {
  if (f.explicit) {
    return `This constitutes non-consensual intimate imagery. It is punishable under Section 66E (violation of privacy), Section 67 and Section 67A (publishing sexually explicit material) of the Information Technology Act, 2000, and under Section 77 (voyeurism, including dissemination of images without consent) and Section 351 (criminal intimidation) of the Bharatiya Nyaya Sanhita, 2023.`;
  }
  return `This is punishable under Section 66E (violation of privacy) and Section 67 (publishing obscene material) of the Information Technology Act, 2000, and under Section 351 (criminal intimidation) and Section 356 (defamation) of the Bharatiya Nyaya Sanhita, 2023.`;
}

/** Fills both complaints. A narrative (the victim's own account, written by the model) goes before the legal paragraph. */
export function fillTemplates(f: CaseFacts, narrative?: string): { platform: string; portal: string } {
  const url = f.postUrl ? `URL of the content: ${f.postUrl}\n` : "";
  const account = narrative?.trim() ? `${narrative.trim()}\n\n` : "";
  const platform = `To: Grievance Officer, ${f.platform}
Subject: Removal of non-consensual synthetically altered image, Kavach case ${f.caseId}

I am ${f.victimName}. A manipulated image of me is being circulated on ${f.platform}. I first saw it on ${f.firstSeen}.
${url}SHA-256 of the image as received: ${f.exhibitSha256}

${derivation(f)}

${account}Under Rule 3(2)(b) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, as amended on 10 February 2026 and in force from 20 February 2026, you are required to remove or disable access to non-consensual synthetically generated or altered intimate and morphed imagery within 2 hours of receiving this complaint. ${sections(f)}

I request that you:
1. Remove the content and all copies within 2 hours of this complaint.
2. Preserve the uploader's account details, IP logs and upload metadata for law enforcement.
3. Confirm the action taken in writing to me, with a reference number.

A Kavach evidence record (fingerprint comparison, hashes and timestamps) is available on request and has been attached to my complaint on the National Cyber Crime Reporting Portal.

${f.victimName}
Date: ${f.firstSeen}

${VERIFY_LINE}`;

  const portal = `Incident report for the National Cyber Crime Reporting Portal (cybercrime.gov.in)
Category: Women/Child related crime, morphed or sexually explicit content
Kavach case: ${f.caseId}

Complainant: ${f.victimName}
Platform: ${f.platform}
${url}Date first seen: ${f.firstSeen}
SHA-256 of the image as received: ${f.exhibitSha256}

Description of the incident:
A manipulated image of me has been created and circulated on ${f.platform} without my consent. ${derivation(f)}

${account}${sections(f)}

Evidence attached: the blurred exhibit stamped with the case id, hash and timestamp; the Kavach fingerprint comparison record; a screenshot of the post.

Relief sought: immediate removal of the content, identification of the person who created and circulated it, and registration of an FIR.

I have also raised a complaint with the platform's grievance officer under the 2-hour removal duty. Helpline 1930 was informed.

${f.victimName}
Date: ${f.firstSeen}

${VERIFY_LINE}`;

  return { platform, portal };
}
