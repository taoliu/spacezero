import * as THREE from 'three';
import type { EntityId } from './engine/ecs/types';
import { World } from './engine/ecs/world';
import {
  RENDERABLE_COMPONENT,
  ROTATION_COMPONENT,
  SPIN_COMPONENT,
} from './game/components/basic';
import { INPUT_STATE_COMPONENT, type InputState } from './game/components/input_state';
import { createSystemScheduler } from './game/systems';

const app = document.getElementById('app');
if (!app) {
  throw new Error('Missing #app container');
}

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 100);
camera.position.set(0, 0.8, 2.2);

const ambient = new THREE.AmbientLight(0xb7c7ff, 0.6);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
keyLight.position.set(2.5, 3, 4);
scene.add(keyLight);

const geometry = new THREE.BoxGeometry(1, 0.35, 0.6);
const material = new THREE.MeshStandardMaterial({
  color: 0x4ac6ff,
  metalness: 0.2,
  roughness: 0.55,
});
const ship = new THREE.Mesh(geometry, material);
scene.add(ship);

const world = new World();
const context = { world };
const scheduler = createSystemScheduler({ inputRoot: app });

const shipEntity = world.createEntity();
world.addComponent(shipEntity, RENDERABLE_COMPONENT, { mesh: ship });
world.addComponent(shipEntity, ROTATION_COMPONENT, { x: 0, y: 0, z: 0 });
world.addComponent(shipEntity, SPIN_COMPONENT, {
  speedX: 0.3,
  speedY: 0.6,
  speedZ: 0,
});

const inputEntity = world.createEntity();
const inputState: InputState = {
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  firePrimary: false,
  fireSecondary: false,
  boost: false,
  mode: 'touch',
};
world.addComponent(inputEntity, INPUT_STATE_COMPONENT, inputState);

scheduler.init(context);

const debugOverlay = document.createElement('div');
debugOverlay.id = 'debug-overlay';
debugOverlay.textContent = 'FPS: --\nFrame: -- ms';
app.appendChild(debugOverlay);

const maxFrameMs = 50;
let lastTime = performance.now();
let fpsAccumulator = 0;
let fpsFrames = 0;
const renderables: EntityId[] = [];

const resize = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

resize();
window.addEventListener('resize', resize, { passive: true });

const tick = (now: number) => {
  const frameMs = now - lastTime;
  lastTime = now;

  const clampedMs = Math.min(frameMs, maxFrameMs);
  const dt = clampedMs / 1000;

  scheduler.update(context, dt);

  world.query([RENDERABLE_COMPONENT, ROTATION_COMPONENT], renderables);
  for (const entityId of renderables) {
    const renderable = world.getComponent(entityId, RENDERABLE_COMPONENT);
    const rotation = world.getComponent(entityId, ROTATION_COMPONENT);

    if (!renderable || !rotation) {
      continue;
    }

    renderable.mesh.rotation.set(rotation.x, rotation.y, rotation.z);
  }

  renderer.render(scene, camera);

  fpsAccumulator += frameMs;
  fpsFrames += 1;

  if (fpsAccumulator >= 250) {
    const fps = (fpsFrames * 1000) / fpsAccumulator;
    const avgFrameMs = fpsAccumulator / fpsFrames;
    const inputLabel = `Move: ${inputState.moveX.toFixed(2)}, ${inputState.moveY.toFixed(2)}`;
    const lookLabel = `Look: ${inputState.lookX.toFixed(2)}, ${inputState.lookY.toFixed(2)}`;
    const actionLabel = `Fire: ${inputState.firePrimary ? '1' : '0'} / ${inputState.fireSecondary ? '1' : '0'}`;
    const boostLabel = `Boost: ${inputState.boost ? '1' : '0'} | ${inputState.mode}`;
    debugOverlay.textContent = `FPS: ${fps.toFixed(1)}\nFrame: ${avgFrameMs.toFixed(1)} ms\n${inputLabel}\n${lookLabel}\n${actionLabel}\n${boostLabel}`;
    fpsAccumulator = 0;
    fpsFrames = 0;
  }

  window.requestAnimationFrame(tick);
};

window.requestAnimationFrame(tick);
