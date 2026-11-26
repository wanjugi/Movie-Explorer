# Approved full-content playback sources

| TMDB identity | Full work | Approved YouTube asset | Provenance and permission |
| --- | --- | --- | --- |
| Movie 10378 | Big Buck Bunny (2008) | [YE7VzlLtp-4](https://www.youtube.com/watch?v=YE7VzlLtp-4) | [Blender Studio project](https://studio.blender.org/projects/big-buck-bunny/) and the official Blender upload. © 2008 Blender Foundation / www.bigbuckbunny.org, [CC Attribution 3.0](https://peach.blender.org/about/). |
| TV 33050, season 1, episode 1 | Pioneer One · Earthfall (2010) | [68RD46kl8ng](https://www.youtube.com/watch?v=68RD46kl8ng) | [Official Pioneer One channel](https://www.youtube.com/channel/UC7nNt1foz_OtCVqVRDwjlBA), Josh Bernhard and Bracey Smith. Creator-published through the official YouTube embed. |

TMDB title, year and the Pioneer One season and episode mapping were cross-checked before registration. Each entry points to the complete work. No app-level country restriction has been verified for these entries; YouTube applies any geographic and embedding restrictions. Other titles remain discovery-only.

The registry accepts exact approved media identities and YouTube asset IDs. New entries require verified title and episode mapping, a complete authorized upload, an approved provider, permission and attribution evidence, known regional restrictions, and a playback check. Retain provider branding and controls. Video goes directly from the provider to the browser, with no app proxy or hidden autoplay. Resume uses matching asset, validated duration and actual provider-reported position. Trailer sessions do not update full-content progress.

During focused Phase 9 checks, isolated Chrome played both official embeds and reported advancing positions. Progress persistence and completion were also exercised with a deterministic player adapter. Validate provider availability, seeking, resume, device-specific capabilities and blocked playback in the final cross-browser review.

Resume waits for the official player to report a compatible duration after playback starts. It requests a seek and checks for a provider-reported position within an eight-second window. A pending seek or zero position does not replace existing progress. When the provider cannot confirm the seek, the watch page offers manual seeking.

Phase 9B dynamic catalogue integration was deliberately skipped. The v1.0.0 release retains these two approved full-content sources. Verify provider availability again before reporting a playback regression, and remove a source if its authorization or provenance can no longer be established.
