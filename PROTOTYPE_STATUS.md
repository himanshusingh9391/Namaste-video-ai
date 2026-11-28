# Local prototype verification

Three narrated MP4 exports were present in the local out directory on 28 November 2026. Their MP4 headers contained H.264 video and AAC audio track markers.

| Export | Duration |
|---|---:|
| water-cycle-daniel-animated.mp4 | 77.611 s |
| water-cycle-daniel-v2-edit-1.mp4 | 77.611 s |
| water-cycle-indian-english-v3.mp4 | 70.016 s |

The render entry point rejected the existing invalid-caption and short-duration fixtures with the expected validation errors. The revised Daniel manifest then passed the same check with six scenes and 77.6 seconds. These checks ran in validation mode and preserved all existing exports. See [prototype instructions](prototype/README.md) for rendering and narration.
