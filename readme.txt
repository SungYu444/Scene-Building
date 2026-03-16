# Scene-Building

Animated gothic church courtyard with hierarchical motion, fragment lighting, multiple textures, and a shapeshifting bat-to-vampire character.

## How to Run
1. `cd /Users/yu/Documents/GitHub/Scene-Building`
2. Start a simple server for textures, e.g. `python -m http.server 8080`
3. Open `http://localhost:8080/main.html` in a WebGL2-capable browser
4. Use **Toggle Animation** to pause/resume the real-time loop

## Requirement Highlights
- **Hierarchy (3+ levels):** Front door (hinge → door → panels) and bell tower (roof → swing arm → bell → clapper) plus the shapeshifter bat (orbit body → head → wings).  
- **360° fly-around:** Camera orbits the scene with `lookAt()` while targeting the nave center at all times.
- **Real-time timing:** Every animation uses `dt` from timestamps so motion speed matches wall-clock time.
- **Per-fragment Blinn-Phong:** Vertex shader now only passes data; the fragment shader computes Blinn-Phong lighting with a half-vector and per-fragment normals.
- **Textures:**  
  - `Public/wall.jpeg` for masonry walls/towers.  
  - `Public/FiveArches_S.jpg` inset behind the rear windows to layer stone trim.  
  - `Public/SevenArches_S.jpg` for doors, walkway, and pitched roof shingles.  
  - `Public/ThreeFlowerShapedB_S.jpg` for the rose window and side lancets.  
  - `Public/grass.png` on the ground plane.  
  - `Public/SevenArches_N.jpg` mapped onto the rear window trio to mix wall + glass textures.  
  UV tiling is customized per mesh to avoid stretching.
- **Custom shader effect:** “Stained-glass shimmer” (fragment shader lines 92-100) animates halos and streaks on any surface flagged with `glassEffect`. Every line in that block is documented.
- **Complexity/Creativity:** Scene includes spinning cross, opening door, swinging bell, lanterns, orbiting bats, and one bat that lands, becomes Dracula, then departs.
- **Quality & style:** Movements pivot at correct joints, textures mipmap cleanly, and code style follows the template conventions.

## Controls / Notes
- Toggle animation with the button; camera + animations pause together.
- Scene uses only template primitives (Cube/Cylinder/Cone/Sphere) and no third-party scripts beyond MV.js + WebGL utilities.

## Assets
All textures come from the provided assignment pack in `Public/`. No external shaders or models were imported.
