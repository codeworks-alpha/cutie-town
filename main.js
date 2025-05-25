// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

// Floor position (25% from bottom = -0.5 in normalized coordinates)
const FLOOR_Y = -0.5;
const GRAVITY = -0.008; // Gravity acceleration
const BOUNCE_DAMPING = 0.6; // How much velocity is retained after bounce

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
});


// Create floor
const floorGeometry = new THREE.PlaneGeometry(4, 0.1);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.position.y = FLOOR_Y;
floor.position.z = 0.5;
scene.add(floor);

// Array of sprite texture paths
const spritePaths = [
    'assets/img/1.png',
    'assets/img/2.png'
];

// Create sprites with physics properties
const sprites = [];
const spritePhysics = [];
const textureLoader = new THREE.TextureLoader();

const backgroundTexture = textureLoader.load('assets/img/bg1.jpg');

// Create a simple background
const bgGeometry = new THREE.PlaneGeometry(2, 2);
const bgMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture });
const background = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(background);

// Load textures and create sprites
spritePaths.forEach((path, i) => {
    const texture = textureLoader.load(
        path,
        // onLoad callback
        (loadedTexture) => {
            console.log(`Loaded texture: ${path}`);
        },
        // onProgress callback
        undefined,
        // onError callback
        (error) => {
            console.warn(`Failed to load texture: ${path}`, error);
            // Fallback to colored square if texture fails to load
            const fallbackColors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 0xFF9F43];
            sprite.material.color.setHex(fallbackColors[i % fallbackColors.length]);
        }
    );
    
    const geometry = new THREE.PlaneGeometry(0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true, // Enable transparency for PNG sprites
        alphaTest: 0.1 // Discard pixels with low alpha
    });
    const sprite = new THREE.Mesh(geometry, material);
    
    // Position sprites in a grid or line
    const cols = Math.ceil(Math.sqrt(spritePaths.length));
    const row = Math.floor(i / cols);
    const col = i % cols;
    const spacing = 0.5;

    sprite.scale.set(1.2, 2, 1); // Adjust size as needed
    
    sprite.position.set(
        (col - (cols - 1) / 2) * spacing,
        0.5 + row * spacing,
        1
    );
    
    scene.add(sprite);
    sprites.push(sprite);
    
    // Physics properties for each sprite
    spritePhysics.push({
        velocity: { x: 0, y: 0 },
        grounded: false,
        beingDragged: false
    });
});

// Drag-and-drop logic
let selectedSprite = null;
let selectedIndex = -1;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(sprites);
    
    if (intersects.length > 0) {
        selectedSprite = intersects[0].object;
        selectedIndex = sprites.indexOf(selectedSprite);
        
        // Stop physics while dragging
        spritePhysics[selectedIndex].beingDragged = true;
        spritePhysics[selectedIndex].velocity.x = 0;
        spritePhysics[selectedIndex].velocity.y = 0;
        spritePhysics[selectedIndex].grounded = false;
    }
}

function onMouseMove(event) {
    if (selectedSprite && selectedIndex >= 0) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Convert mouse coordinates to world coordinates
        const aspect = window.innerWidth / window.innerHeight;
        const worldX = mouse.x * aspect;
        const worldY = mouse.y;
        
        selectedSprite.position.set(worldX, worldY, 1);
    }
}

function onMouseUp() {
    if (selectedIndex >= 0) {
        // Re-enable physics
        spritePhysics[selectedIndex].beingDragged = false;
        
        // Add some initial velocity based on release position
        if (selectedSprite.position.y > FLOOR_Y + 0.1) {
            spritePhysics[selectedIndex].velocity.y = 0; // Start with no upward velocity
        }
    }
    
    selectedSprite = null;
    selectedIndex = -1;
}

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);

// Physics update function
function updatePhysics() {
    sprites.forEach((sprite, index) => {
        const physics = spritePhysics[index];
        
        // Skip physics if being dragged
        if (physics.beingDragged) return;
        
        // Apply gravity
        if (!physics.grounded) {
            physics.velocity.y += GRAVITY;
        }
        
        // Update position
        sprite.position.x += physics.velocity.x;
        sprite.position.y += physics.velocity.y;
        
        // Check floor collision
        const spriteBottom = sprite.position.y - 0.075; // Half of sprite height
        if (spriteBottom <= FLOOR_Y && physics.velocity.y <= 0) {
            // Hit the floor
            sprite.position.y = FLOOR_Y + 0.075; // Position sprite on floor
            
            if (Math.abs(physics.velocity.y) > 0.01) {
                // Bounce
                physics.velocity.y = -physics.velocity.y * BOUNCE_DAMPING;
            } else {
                // Stop bouncing and ground the sprite
                physics.velocity.y = 0;
                physics.grounded = true;
            }
        }
        
        // Apply friction when grounded
        if (physics.grounded) {
            physics.velocity.x *= 0.95;
        }
        
        // Keep sprites within screen bounds
        const aspect = window.innerWidth / window.innerHeight;
        const maxX = aspect - 0.075;
        const minX = -aspect + 0.075;
        
        if (sprite.position.x > maxX) {
            sprite.position.x = maxX;
            physics.velocity.x *= -0.5;
        } else if (sprite.position.x < minX) {
            sprite.position.x = minX;
            physics.velocity.x *= -0.5;
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}

animate();