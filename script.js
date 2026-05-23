// ════════════════════════════════════════════════════════
// CUSTOM CURSOR LOGIC
// Two elements: #cur (dot) and #cur-r (ring).
// The dot snaps exactly to the mouse.
// The ring lags behind slightly for a trailing "drag" effect.
// ════════════════════════════════════════════════════════

const cur = document.getElementById('cur');   // The small cyan dot element
const crr = document.getElementById('cur-r'); // The larger hollow ring element

let mx = 0, my = 0; // Current mouse X and Y position
let rx = 0, ry = 0; // Ring's current position (lags behind mx/my)

// Track the actual mouse position on every move
document.addEventListener('mousemove', e => {
  mx = e.clientX; // e.clientX/Y = coordinates relative to viewport
  my = e.clientY;
});

// Self-invoking animation loop — runs every frame via requestAnimationFrame
(function ac() {
  // Snap the dot directly to the mouse position
  cur.style.cssText = `left:${mx}px;top:${my}px`;

  // Move the ring 10% of the way toward the mouse each frame (lerp = linear interpolation)
  // Result: ring smoothly "chases" the cursor with inertia/lag
  rx += (mx - rx) * 0.1;
  ry += (my - ry) * 0.1;
  crr.style.cssText = `left:${rx}px;top:${ry}px`;

  requestAnimationFrame(ac); // Schedule next frame — creates ~60fps loop
})(); // The () at the end immediately calls the function


// ════════════════════════════════════════════════════════
// THREE.JS — 3D ANIMATED BACKGROUND
// ════════════════════════════════════════════════════════

// --- RENDERER SETUP ---
const canvas = document.getElementById('bg'); // Get the <canvas> element

// Create a WebGL renderer using that canvas
const renderer = new THREE.WebGLRenderer({
  canvas,          // Which canvas to draw on
  antialias: true, // Smooth edges on 3D shapes (no jagged pixels)
  alpha: true      // Allow transparent background (so page behind shows through)
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
// Sets pixel density. devicePixelRatio is 2 on retina screens.
// We cap at 2 to avoid performance issues on 4K screens.

renderer.setSize(window.innerWidth, window.innerHeight);
// Canvas should fill the entire viewport

renderer.setClearColor(0, 0);
// Background color = black (0x000000), opacity = 0 (fully transparent)
// This lets the CSS --bg color show through instead


// --- SCENE ---
const scene = new THREE.Scene();
// A Scene is the "world" that holds all 3D objects, lights, etc.


// --- CAMERA ---
const camera = new THREE.PerspectiveCamera(
  70,                                      // Field of view in degrees (wider = more zoom out)
  window.innerWidth / window.innerHeight,  // Aspect ratio (must match canvas size)
  0.1,                                     // Near clipping plane — objects closer than 0.1 units are invisible
  200                                      // Far clipping plane — objects beyond 200 units are invisible
);
camera.position.set(0, 0, 12);
// Place camera at (x=0, y=0, z=12) — 12 units in front of origin, looking toward negative Z


// ════════════════════════════════════════════════════════
// LIGHTING
// Without lights, objects using MeshPhongMaterial appear black.
// ════════════════════════════════════════════════════════

scene.add(new THREE.AmbientLight(0x00e5ff, 0.25));
// AmbientLight illuminates all objects equally from all directions.
// Color: cyan (0x00e5ff), intensity: 0.25 (subtle fill light so nothing is pitch black)

const pL1 = new THREE.PointLight(0x00e5ff, 2.2, 35);
pL1.position.set(6, 5, 5);
scene.add(pL1);
// PointLight = like a light bulb, emits light in all directions from a point.
// Cyan color, intensity 2.2, range 35 units. Positioned upper-right.

const pL2 = new THREE.PointLight(0x5468ff, 1.6, 30);
pL2.position.set(-8, -3, 3);
scene.add(pL2);
// Blue light from lower-left — creates color contrast with the cyan light.

const pL3 = new THREE.PointLight(0xf72585, 0.9, 20);
pL3.position.set(0, -7, -2);
scene.add(pL3);
// Pink/magenta light from below — adds dramatic underlighting to shapes.


// ════════════════════════════════════════════════════════
// HERO 3D OBJECT (Right side of the screen, visible in hero section)
// A group of nested icosahedrons + 3 orbital rings
// ════════════════════════════════════════════════════════

const heroG = new THREE.Group();
// Group acts as a container — transforming the group affects all children together.

// Outer wireframe icosahedron (20-faced sphere-like shape)
heroG.add(new THREE.Mesh(
  new THREE.IcosahedronGeometry(3, 1),   // Radius 3, detail level 1
  new THREE.MeshPhongMaterial({
    color:       0x00e5ff,
    wireframe:   true,      // Only draw edges, not faces
    transparent: true,
    opacity:     0.13        // Very faint — mostly see-through
  })
));

// Inner glowing icosahedron (faces filled, rendered from inside)
heroG.add(new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.1, 1),
  new THREE.MeshPhongMaterial({
    color:       0x5468ff,
    transparent: true,
    opacity:     0.06,
    side:        THREE.BackSide  // Render inside faces only — creates an inner glow effect
  })
));

// Central glowing sphere
heroG.add(new THREE.Mesh(
  new THREE.SphereGeometry(1, 32, 32), // Radius 1, 32 segments wide and tall (smooth sphere)
  new THREE.MeshPhongMaterial({
    color:             0x00e5ff,
    emissive:          0x00e5ff,   // emissive = self-illuminating, not dependent on lights
    emissiveIntensity: 0.15,
    transparent:       true,
    opacity:           0.1
  })
));

// Helper function to create a torus (ring/donut shape) and position it at an angle
function ring(r, t, col, rx, ry) {
  // r = ring radius, t = tube thickness, col = color, rx/ry = rotation angles
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, t, 8, 80),
    // TorusGeometry(radius, tubeRadius, tubularSegments, radialSegments)
    new THREE.MeshPhongMaterial({
      color:             col,
      emissive:          col,    // Rings glow with their own color
      emissiveIntensity: 0.25,
      transparent:       true,
      opacity:           0.55
    })
  );
  m.rotation.x = rx; // Tilt around X axis (radians)
  m.rotation.y = ry; // Tilt around Y axis
  return m;
}

// Create 3 orbital rings at different angles and colors
const r1 = ring(3.7, 0.015, 0x00e5ff, Math.PI/3, 0);
// Cyan ring — tilted 60° on X axis
const r2 = ring(4,   0.01,  0x5468ff, Math.PI/2, Math.PI/4);
// Blue ring — 90° on X, 45° on Y (nearly vertical, slightly rotated)
const r3 = ring(3.4, 0.012, 0xf72585, Math.PI/6, Math.PI/3);
// Pink ring — 30° on X, 60° on Y

heroG.add(r1, r2, r3); // Add all three rings to the group

heroG.position.set(4.5, 0.5, 0);
// Place the group to the right side (x=4.5), slightly up (y=0.5), at z=0
scene.add(heroG);


// ════════════════════════════════════════════════════════
// FLOATING BACKGROUND SHAPES (22 random small wireframe objects)
// ════════════════════════════════════════════════════════

const shapes = []; // Track all shapes so we can animate them

// Three materials — wireframe in cyan, blue, pink
const fmats = [
  new THREE.MeshPhongMaterial({ color: 0x00e5ff, wireframe: true, transparent: true, opacity: 0.22 }),
  new THREE.MeshPhongMaterial({ color: 0x5468ff, wireframe: true, transparent: true, opacity: 0.18 }),
  new THREE.MeshPhongMaterial({ color: 0xf72585, wireframe: true, transparent: true, opacity: 0.16 }),
];

// Four geometry types — different polygon shapes
const fgeos = [
  new THREE.OctahedronGeometry(0.45),   // 8-faced diamond shape
  new THREE.TetrahedronGeometry(0.5),   // 4-faced pyramid
  new THREE.IcosahedronGeometry(0.38, 0), // 20-faced shape (rougher, detail=0)
  new THREE.DodecahedronGeometry(0.35), // 12-faced shape
];

for (let i = 0; i < 22; i++) {
  const m = new THREE.Mesh(
    fgeos[i % fgeos.length],  // Cycle through the 4 geometry types
    fmats[i % fmats.length]   // Cycle through the 3 materials
  );

  // Random position spread across the scene
  m.position.set(
    (Math.random() - 0.5) * 30,   // X: -15 to +15
    (Math.random() - 0.5) * 22,   // Y: -11 to +11
    (Math.random() - 0.5) * 14 - 5  // Z: -12 to +2 (pushed slightly behind camera)
  );

  // Random initial rotation
  m.rotation.set(
    Math.random() * 6,  // 0 to ~6 radians (~0 to 340°)
    Math.random() * 6,
    Math.random() * 6
  );

  // Store animation parameters in userData (custom per-object data)
  m.userData = {
    sx:  (Math.random() - 0.5) * 0.012, // X spin speed (positive or negative)
    sy:  (Math.random() - 0.5) * 0.009, // Y spin speed
    fy:  Math.random() * 6,             // Phase offset for floating sine wave (0 to 6)
    fs:  0.003 + Math.random() * 0.005  // Float speed (how fast fy increments)
  };

  scene.add(m);
  shapes.push(m); // Keep reference for animation loop
}


// ════════════════════════════════════════════════════════
// WIREFRAME GRID (floor/ground plane)
// ════════════════════════════════════════════════════════

const grid = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60, 30, 30),
  // PlaneGeometry(width, height, widthSegments, heightSegments)
  // widthSegments/heightSegments = 30 means 30×30 grid cells
  new THREE.MeshBasicMaterial({
    color:       0x00e5ff,
    wireframe:   true,
    transparent: true,
    opacity:     0.022  // Very faint — mostly invisible
  })
);

grid.rotation.x = -Math.PI / 2; // Rotate from vertical (default) to horizontal (flat floor)
grid.position.y = -9;            // Push down below the scene
scene.add(grid);


// ════════════════════════════════════════════════════════
// PARTICLE SYSTEMS
// Two sets of floating point particles — cyan (dense) and blue (sparser/larger)
// ════════════════════════════════════════════════════════

// --- Cyan particles (3000 points) ---
const PC = 3000;                    // Number of cyan particles
const pp = new Float32Array(PC * 3); // Each particle has 3 floats: x, y, z

for (let i = 0; i < PC; i++) {
  pp[i * 3]     = (Math.random() - 0.5) * 70;  // X position: -35 to +35
  pp[i * 3 + 1] = (Math.random() - 0.5) * 50;  // Y position: -25 to +25
  pp[i * 3 + 2] = (Math.random() - 0.5) * 35 - 5; // Z: depth spread, biased backward
}

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
// BufferGeometry is an efficient way to store geometry data.
// BufferAttribute(array, itemSize=3) means 3 values per vertex (x,y,z).

const parts = new THREE.Points(pGeo,
  new THREE.PointsMaterial({
    color:        0x00e5ff,
    size:         0.038,            // Tiny dots
    transparent:  true,
    opacity:      0.45,
    blending:     THREE.AdditiveBlending, // Particles add brightness where they overlap (bright cluster effect)
    depthWrite:   false             // Prevents particles from blocking each other's rendering order
  })
);
scene.add(parts);


// --- Blue particles (500 points, larger) ---
const AP = 500;
const ap = new Float32Array(AP * 3);

for (let i = 0; i < AP; i++) {
  ap[i * 3]     = (Math.random() - 0.5) * 55;
  ap[i * 3 + 1] = (Math.random() - 0.5) * 40;
  ap[i * 3 + 2] = (Math.random() - 0.5) * 22 - 4;
}

const aGeo = new THREE.BufferGeometry();
aGeo.setAttribute('position', new THREE.BufferAttribute(ap, 3));
scene.add(new THREE.Points(aGeo,
  new THREE.PointsMaterial({
    color:      0x5468ff,
    size:       0.11,         // Larger than cyan particles
    transparent: true,
    opacity:    0.35,
    blending:   THREE.AdditiveBlending,
    depthWrite: false
  })
));


// ════════════════════════════════════════════════════════
// MOUSE AND SCROLL TRACKING
// Camera and objects react to where the mouse is and how far scrolled.
// ════════════════════════════════════════════════════════

let trX = 0, trY = 0; // Target rotation for heroG (from mouse)
let crX = 0, crY = 0; // Current rotation (lerps toward target)
let tcX = 0, tcY = 0; // Target camera X/Y offset

document.addEventListener('mousemove', e => {
  // Normalize mouse position to -1...+1 range
  const nx = (e.clientX / window.innerWidth) * 2 - 1;  // -1 = left edge, +1 = right edge
  const ny = -(e.clientY / window.innerHeight) * 2 + 1; // -1 = bottom, +1 = top (Y is flipped)

  trY = nx * 0.45; // Mouse left-right → rotate heroG on Y axis
  trX = ny * 0.22; // Mouse up-down → rotate heroG on X axis
  tcX = nx * 1.6;  // Mouse left-right → shift camera X
  tcY = ny * 0.9;  // Mouse up-down → shift camera Y
});

// Resize handler — keeps renderer and camera correct when window resizes
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // Must call after changing camera properties
});


// ════════════════════════════════════════════════════════
// MAIN ANIMATION LOOP
// Runs ~60 times per second. Updates all 3D positions and renders the scene.
// ════════════════════════════════════════════════════════

let t = 0; // Global time counter, increments each frame

(function anim() {
  requestAnimationFrame(anim); // Schedule next frame before doing work
  t += 0.008;                   // Increment time (controls oscillation speed)

  // --- Smoothly lerp heroG rotation toward mouse target ---
  crX += (trX - crX) * 0.05; // Move 5% of the remaining distance each frame
  crY += (trY - crY) * 0.05;

  // --- Smoothly pan camera toward mouse position ---
  camera.position.x += (tcX - camera.position.x) * 0.04;
  camera.position.y += (tcY - camera.position.y) * 0.04;

  // --- Scroll-based parallax ---
  const sf = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
  // sf = scroll fraction: 0 at top, 1 at bottom of page
  // The "|| 1" prevents division by zero on pages that don't scroll.

  camera.position.z = 12 - sf * 4;
  // Camera moves from z=12 (top) to z=8 (bottom) — zooms in as you scroll

  parts.position.y = -sf * 8;
  // Cyan particles drift upward as you scroll (parallax effect)

  // --- Animate heroG ---
  heroG.rotation.x = crX * 0.6 + t * 0.11; // Mouse influence + slow auto-rotate
  heroG.rotation.y = crY * 0.8 + t * 0.16;

  // Spin each orbital ring independently
  r1.rotation.z += 0.007; // Cyan ring spins on Z
  r2.rotation.x += 0.004; // Blue ring spins on X
  r3.rotation.y += 0.005; // Pink ring spins on Y

  // Pulse the heroG scale — subtle breathing/pulsing effect
  heroG.scale.setScalar(1 + Math.sin(t * 1.4) * 0.024);
  // Scale oscillates between 0.976 and 1.024

  // Slide heroG off-screen to the left as user scrolls down
  heroG.position.x = 4.5 - sf * 14;  // Moves left (4.5 at top, -9.5 at bottom)
  heroG.position.y = 0.5 - sf * 4;   // Also moves down slightly

  // --- Animate floating shapes ---
  shapes.forEach(s => {
    s.rotation.x += s.userData.sx * 2; // Each shape has its own spin speed
    s.rotation.y += s.userData.sy * 2;
    s.userData.fy += s.userData.fs;    // Advance the sine wave phase
    s.position.y += Math.sin(s.userData.fy) * 0.009;
    // Move Y position along a sine wave → shapes bob up and down gently
  });

  // --- Slowly rotate the entire particle field ---
  parts.rotation.y += 0.0003; // Almost imperceptible drift — makes starfield feel alive

  // --- Pulse the point lights over time ---
  pL1.intensity = 2 + Math.sin(t * 1.3) * 0.5;   // Cyan light: 1.5 → 2.5
  pL2.intensity = 1.4 + Math.cos(t * 0.9) * 0.4; // Blue light: 1.0 → 1.8
  // sin/cos at different speeds means the lights don't pulse in sync

  // --- Render the frame ---
  renderer.render(scene, camera);
  // Draws everything in `scene` from the perspective of `camera` onto the canvas.
})(); // Immediately invoked to start the loop


// ════════════════════════════════════════════════════════
// SCROLL REVEAL — IntersectionObserver
// Watches elements and adds the '.vis' class when they enter the viewport.
// ════════════════════════════════════════════════════════

const obs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      // Element is now visible in the viewport:
      e.target.classList.add('vis'); // Triggers the CSS reveal animation

      // If this element has a progress bar, animate it to the target width
      const b = e.target.querySelector('.bar-f');
      if (b) {
        setTimeout(() => {
          b.style.width = (e.target.dataset.bar || 80) + '%';
          // dataset.bar reads the HTML data-bar="80" attribute
          // Defaults to 80% if no data-bar attribute found
        }, 200); // Small delay so the bar animates after the card fades in
      }
    }
  });
}, { threshold: 0.12 });
// threshold: 0.12 means the callback fires when 12% of the element is visible.
// Prevents elements from triggering too early (when barely peeking into viewport).

// Attach observer to all animated card elements
document.querySelectorAll('.sk-card, .cert-card, .edu-card, .proj-card, .rev')
  .forEach(el => obs.observe(el));
// querySelectorAll returns all elements matching the CSS selectors.
// We observe each one so the IntersectionObserver watches it.

// --- Stagger the animation delays so cards reveal one after another ---

document.querySelectorAll('.sk-card').forEach((c, i) => {
  c.style.transitionDelay = (i * 0.07) + 's';
  // Card 0: 0s delay, Card 1: 0.07s, Card 2: 0.14s, etc.
});

document.querySelectorAll('.cert-card').forEach((c, i) => {
  c.style.transitionDelay = (i * 0.055) + 's';
  // Cert cards reveal slightly faster stagger (0.055s apart)
});

document.querySelectorAll('.proj-card').forEach((c, i) => {
  c.style.transitionDelay = (i * 0.08) + 's';
  // Project cards slightly slower stagger (0.08s apart)
});


// ════════════════════════════════════════════════════════
// LOADER FADE-OUT
// After the page fully loads, wait 1.1s then fade out the loader overlay.
// ════════════════════════════════════════════════════════

window.addEventListener('load', () => {
  // 'load' fires after ALL resources (images, scripts, fonts) are downloaded.
  // This is later than DOMContentLoaded, which fires only after HTML parsing.
  setTimeout(() => {
    document.getElementById('ldr').classList.add('out');
    // Adding .out triggers the CSS: opacity:0; visibility:hidden — smooth fade-out.
  }, 1100); // 1.1 second delay lets users see the loader briefly before it disappears
});
