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
    camera.left = -aspect +0.6;
    camera.right = aspect -0.6;
    camera.top = 1.00;
    camera.bottom = -1.00;
    camera.updateProjectionMatrix();
});

// Load textures
const textureLoader = new THREE.TextureLoader();

const bgUrls = [
    'assets/img/bg0.jpg',
    'assets/img/bg1.jpg',
    'assets/img/bg2.jpg',
    'assets/img/bg3.jpg',
    'assets/img/bg0.jpg'

];

const segmentWidth = 2;
const totalWorldWidth = bgUrls.length * segmentWidth;
const halfViewWidth = (camera.right - camera.left) / 2;
const minCameraX = halfViewWidth;
const maxCameraX = totalWorldWidth - halfViewWidth;


const backgroundSegments = [];

const trashZone = {
    x: -0.8,  // World coordinates (you may tweak these)
    y: 0.8,
    radius: 0.2  // Area of effect
};

bgUrls.forEach((url, index) => {
    const texture = textureLoader.load(url);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshBasicMaterial({ map: texture, depthWrite: false });
    const geometry = new THREE.PlaneGeometry(2, 2); // adjust width/height per segment
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(index * 2, 0, -1); // Spread horizontally
    scene.add(mesh);
    backgroundSegments.push(mesh);
});


const spriteTextures = [
    textureLoader.load('assets/img/1.png'),
    textureLoader.load('assets/img/4.png'),
    textureLoader.load('assets/img/3.png')

];

const objectTextures = [
    textureLoader.load('assets/img/lupa-1.png'),
    textureLoader.load('assets/img/bread.webp'),
    textureLoader.load('assets/img/milk.png'),
    textureLoader.load('assets/img/coffee.png'),
    textureLoader.load('assets/img/lettuce.png')
];

const bigObjectTextures = [
    textureLoader.load('assets/img/basket.png'),
];



// Sprites
const sprites = [];
const objects = [];

spriteTextures.forEach((texture, index) => {
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.2, 0.6, 1); // Adjust size as needed
    sprite.position.set((index - 0.5) * 0.15, 0, 1); // Spread sprites horizontally
    scene.add(sprite);
    sprites.push(sprite);
});

bigObjectTextures.forEach((texture, index) => {
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.15, 0.3, 1);
    sprite.position.set((index - 0.5) * 0.2, 0, 1); // Spread sprites horizontally
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

const edgeMargin = 100; // pixels
const scrollSpeed = 0.03;

function onMouseMove(event) {
    if (selectedSprite) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Move the selected sprite

        const spriteHalfWidth = 0.1; // Approximate half width of sprite
        const worldMouseX = mouse.x * (camera.right - camera.left) / 2 + camera.position.x;
        const worldMouseY = mouse.y * (camera.top - camera.bottom) / 2 + camera.position.y;
    
        // Clamp the sprite’s x position within visible world
        const minX = 0 + spriteHalfWidth;
        const maxX = totalWorldWidth - spriteHalfWidth;
    
        selectedSprite.position.set(
            Math.max(minX - 1, Math.min(maxX, worldMouseX)),
            worldMouseY,
            1
        );

        

        // Scroll camera if near screen edge
        if (event.clientX < edgeMargin) {
            camera.position.x -= scrollSpeed;
        } else if (event.clientX > window.innerWidth - edgeMargin) {
            camera.position.x += scrollSpeed;
        }

        camera.position.x = Math.max(minCameraX - 1, Math.min(maxCameraX - 1, camera.position.x));

    }
    
    // Clamp camera within bounds
}

function onMouseUp() {
    selectedSprite = null;
}

document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mouseup', onMouseUp);

console.log("Mouse events initialized.");

// allow for touch events
document.addEventListener('touchstart', (event) => {
    if (event.touches.length > 0) {
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(sprites);
        if (intersects.length > 0) {
            selectedSprite = intersects[0].object;
            selectedSprite.userData.velocityY = 0; // Stop falling
        }
    }
});
document.addEventListener('touchmove', (event) => {
    if (selectedSprite && event.touches.length > 0) {
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

        // Move the selected sprite
        const spriteHalfWidth = 0.1; // Approximate half width of sprite
        const worldMouseX = mouse.x * (camera.right - camera.left) / 2 + camera.position.x;
        const worldMouseY = mouse.y * (camera.top - camera.bottom) / 2 + camera.position.y;

        // Clamp the sprite’s x position within visible world
        const minX = 0 + spriteHalfWidth;
        const maxX = totalWorldWidth - spriteHalfWidth;

        selectedSprite.position.set(
            Math.max(minX - 1, Math.min(maxX, worldMouseX)),
            worldMouseY,
            1
        );

        // Scroll camera if near screen edge
        if (event.touches[0].clientX < edgeMargin) {
            camera.position.x -= scrollSpeed;
        } else if (event.touches[0].clientX > window.innerWidth - edgeMargin) {
            camera.position.x += scrollSpeed;
        }

        camera.position.x = Math.max(minCameraX - 1, Math.min(maxCameraX - 1, camera.position.x));
    }
})

document.addEventListener('touchend', () => {
    selectedSprite = null;
})

document.addEventListener('fullscreenchange', () => {
    // Force a resize when fullscreen changes
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);

    const aspect = width / height;
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();
});

document.getElementById('fullscreen-btn').addEventListener('click', () => {
    const container = document.getElementById('scene-container');
  
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) { // Safari
      container.webkitRequestFullscreen();
    } else if (container.mozRequestFullScreen) { // Firefox
      container.mozRequestFullScreen();
    } else if (container.msRequestFullscreen) { // IE/Edge
      container.msRequestFullscreen();
    }
  });

// Toggle side panel
const gearBtn = document.getElementById('gear-btn');
const sidePanel = document.getElementById('side-panel');
const closeBtn = document.getElementById('close-btn');

gearBtn.addEventListener('click', () => {
    sidePanel.classList.toggle('open');
});
closeBtn.addEventListener('click', () => {
    sidePanel.classList.remove('open');
});

// Handle character add buttons
document.querySelectorAll('.add-character-btn-img').forEach(btn => {

    btn.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('texture-src', btn.dataset.src);
    });

    btn.addEventListener('click', () => {
        const imgSrc = btn.dataset.src;
        const texture = textureLoader.load(imgSrc);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.1, 0.2, 1); // Customize if needed

        // Spawn near center of view
        const spawnX = camera.position.x;
        sprite.position.set(spawnX, 0, 1);
        sprite.userData.velocityY = 0;

        scene.add(sprite);
        sprites.push(sprite);
    });
});

// Prevent default to allow drop on canvas
renderer.domElement.addEventListener('dragover', (event) => {
    event.preventDefault();
});

renderer.domElement.addEventListener('drop', (event) => {
    event.preventDefault();
    
    const textureSrc = event.dataTransfer.getData('texture-src');
    if (!textureSrc) return;

    const texture = textureLoader.load(textureSrc);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.1, 0.2, 1); // Default size

    // Convert drop position to world coordinates
    const rect = renderer.domElement.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const worldX = mouseX * (camera.right - camera.left) / 2 + camera.position.x;
    const worldY = mouseY * (camera.top - camera.bottom) / 2 + camera.position.y;

    sprite.position.set(worldX, worldY, 1);
    sprite.userData.velocityY = 0;

    scene.add(sprite);
    sprites.push(sprite);
});



// Animation loop
const gravity = -0.009;
const floorY = -0.2;


function animate() {
    requestAnimationFrame(animate);
    //background.material.map.offset.x = camera.position.x * 0.1;
    sprites.forEach(sprite => {
        if (sprite !== selectedSprite) {
            if (sprite.position.y > floorY) {
                sprite.userData.velocityY += gravity;
                sprite.position.y += sprite.userData.velocityY;
    
                // Floor collision from above
                if (sprite.position.y <= floorY) {
                    sprite.position.y = floorY;
                    sprite.userData.velocityY *= -0.3;
                }
            } else {
                sprite.userData.velocityY = 0;
            }
        }
    
        // Z-index effect: sprites closer to bottom appear in front
        sprite.position.z = (-sprite.position.y > 0 ? -sprite.position.y : 1);
 // Check if selected sprite is near trash zone
        if (sprite === selectedSprite) {
            const dx = sprite.position.x - trashZone.x;
            const dy = sprite.position.y - trashZone.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < trashZone.radius) {
                scene.remove(sprite);
                sprites.splice(index, 1);
                selectedSprite = null; // Also unselect it
            }
        }
    });

    backgroundSegments.forEach((segment, index) => {
        segment.position.x = index * segmentWidth;
    });

    renderer.render(scene, camera);
}

animate();