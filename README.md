# Scene-Building

An animated cathedral courtyard rendered with WebGL, featuring hierarchical motion, textured materials, and custom lighting effects.

## Run Instructions
1. `cd /Users/yu/Documents/GitHub/Scene-Building`
2. Launch a static server so textures load without CORS issues, e.g. `python -m http.server 8080`
3. Open `http://localhost:8080/main.html` in a WebGL 2.0 capable browser (Chrome/Firefox/Edge)
4. Use the **Toggle Animation** button to pause or resume the real-time simulation

## Implemented Requirements
- **Hierarchical animation:** The left tower houses a 3-level bell rig (tower head → swinging yoke → bell → clapper) whose children inherit rotations.
- **360° orbit camera:** The synthetic camera executes a perpetual lookAt() orbit around the transept while focusing on the nave center.
- **Real-time clock:** All motion integrates with `dt` derived from timestamps so one simulated second ≈ one real second.
- **Fragment Blinn-Phong:** Lighting now executes per-fragment with a Blinn-Phong half-vector for tighter highlights.
- **Textures used creatively:**  
  - `Public/Screenshot 2026-03-11 at 2.06.25 PM.jpeg` (facade photo) remapped across nave flanks, entrance, and tower pillars for photo-real masonry, then blended with  
  - `Public/FiveArches_S.jpg` stone insets that back the rear window trio so both textures play together on that surface  
  - `Public/grass.png` carpets the courtyard to contrast the stone walkway  
  - `Public/SevenArches_N.jpg` brings patterned mullions to the new rear window trio  
  - `Public/SevenArches_S.jpg` (warm tiles) on the copper roof, walkway, and doors  
  - `Public/ThreeFlowerShapedB_S.jpg` (stained glass) on the rose window plus lancet windows  
  Texture scaling/rotation varies by surface for meaningful mapping.
- **Novel shader effect:** A “stained-glass shimmer” written from scratch in the fragment shader (see section below) adds animated halos to any window using the glass toggle.
- **Scene complexity & creativity:** Animated door, bell, spinning roof cross, courtyard lanterns, and a flock of orbiting bats create layered motion and storytelling.
- **Quality & style:** Hierarchical transforms respect pivots (e.g., door hinges), textures tile cleanly, and shading operates in perspective projection.

## Custom Shader Effect
**Effect:** *Stained-glass shimmer* inside `main.html`’s fragment shader. Each line of the effect block is commented, explaining how UV-centered pulses, radial falloff, and diagonal streaks mix to form a glowing halo tinted via `uGlassGlowColor`. The effect activates whenever `setSurface` enables the glass mode, so windows both use texture detail and emit animated light.

## Controls & Notes
- Toggle animation with the provided button. When paused, the camera and rig freeze but the last frame remains visible.
- The scene is authored entirely with the supplied template primitives (cube, cylinder, cone, sphere); no external geometry or engines are needed.

## Assets
All textures reside in `Public/` and originate from the assignment pack. No other third-party assets are required.
