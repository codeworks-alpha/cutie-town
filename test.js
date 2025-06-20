// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('scene-container').appendChild(renderer.domElement);

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

// Load textures
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('assets/img/bg1.jpg');
const spriteTextures = [
    textureLoader.load('assets/img/1.png'),
    textureLoader.load('assets/img/3.png')
];
const FLOOR_Y = -1 + (0.25 * 2); // = -0.5

// Background
const bgGeometry = new THREE.PlaneGeometry(2, 2);
const bgMaterial = new THREE.MeshBasicMaterial({ map: backgroundTexture });
const background = new THREE.Mesh(bgGeometry, bgMaterial);
scene.add(background);

// Sprites
const sprites = [];
spriteTextures.forEach((texture, index) => {
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.2, 0.4, 1); // Adjust size as needed
    sprite.position.set((index - 0.5) * 0.3, 0, 1); // Spread sprites horizontally
    scene.add(sprite);
    sprites.push(sprite);
});

sprites.forEach(sprite => {
    sprite.userData.velocityY = 0;
});

// Drag-and-drop logic
let selectedSprite = null;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(sprites);
    if (intersects.length > 0) {
        selectedSprite = intersects[0].object;
        selectedSprite.userData.velocityY = 0; // Stop falling
    }
}

function onMouseMove(event) {
    if (selectedSprite) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        selectedSprite.position.set(mouse.x, mouse.y, 1);
    }
}

function onMouseUp() {
    selectedSprite = null;
}

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);

// Animation loop
const gravity = -0.005;
const floorY = -0.5;

function animate() {
    requestAnimationFrame(animate);

    sprites.forEach(sprite => {
        if (sprite !== selectedSprite) {
            sprite.userData.velocityY += gravity;
            sprite.position.y += sprite.userData.velocityY;

            // Floor collision
            if (sprite.position.y <= floorY) {
                sprite.position.y = floorY;
                sprite.userData.velocityY = 0;
            }
        }
    });

    renderer.render(scene, camera);
}
animate();