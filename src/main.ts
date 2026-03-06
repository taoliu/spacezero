import * as THREE from 'three';
import type { EntityId } from './engine/ecs/types';
import { World } from './engine/ecs/world';
import { RENDERABLE_COMPONENT } from './game/components/basic';
import { ECONOMY_COMPONENT, type EconomyState } from './game/components/economy';
import { HIT_MARKER_COMPONENT, type HitMarker } from './game/components/hit_marker';
import { INPUT_STATE_COMPONENT, type InputState } from './game/components/input_state';
import { AUTO_TRACE_COMPONENT, type AutoTrace } from './game/components/auto_trace';
import { SHIP_CONTROLLER_COMPONENT, type ShipController } from './game/components/ship_controller';
import { STAGE_RUNTIME_COMPONENT, type StageRunState } from './game/components/stage_runtime';
import { ENEMY_TAG_COMPONENT, PLAYER_TAG_COMPONENT } from './game/components/tags';
import { TARGETING_COMPONENT, type Targeting } from './game/components/targeting';
import { TRANSFORM_COMPONENT, type Transform } from './game/components/transform';
import { VELOCITY_COMPONENT, type Velocity } from './game/components/velocity';
import { WEAPON_SLOTS_COMPONENT, type WeaponSlots } from './game/components/weapon_slots';
import { EventBus } from './game/events/bus';
import { ContentLoader } from './game/data/content_loader';
import { tuning } from './game/tuning';
import { createSystemScheduler } from './game/systems';
import { EnvironmentCues } from './engine/renderer/environment';
import type { GameContext } from './game/systems/types';

const app = document.getElementById('app');
if (!app) {
  throw new Error('Missing #app container');
}

const suppressGestures = (element: HTMLElement): void => {
  let lastTapTime = 0;
  const doubleTapWindowMs = 300;

  const preventDefault = (event: Event): void => {
    if (event.cancelable) {
      event.preventDefault();
    }
  };

  element.addEventListener(
    'touchstart',
    (event: TouchEvent) => {
      if (event.touches.length > 1) {
        preventDefault(event);
      }
    },
    { passive: false },
  );
  element.addEventListener(
    'touchmove',
    (event: TouchEvent) => {
      preventDefault(event);
    },
    { passive: false },
  );
  element.addEventListener(
    'touchend',
    (event: TouchEvent) => {
      const now = performance.now();
      if (now - lastTapTime < doubleTapWindowMs) {
        preventDefault(event);
      }
      lastTapTime = now;
    },
    { passive: false },
  );
  element.addEventListener(
    'touchcancel',
    (event: TouchEvent) => {
      preventDefault(event);
    },
    { passive: false },
  );

  element.addEventListener('gesturestart', preventDefault, { passive: false });
  element.addEventListener('gesturechange', preventDefault, { passive: false });
  element.addEventListener('gestureend', preventDefault, { passive: false });
};

suppressGestures(app);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x040812);
scene.fog = new THREE.FogExp2(0x060b18, 0.0016);

const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 3000);
camera.position.set(0, 0.8, 2.2);

const ambient = new THREE.AmbientLight(0xb9cbff, 0.72);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xe8f4ff, 1.2);
keyLight.position.set(2.6, 3.2, 3.6);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x67d7ff, 0.75);
rimLight.position.set(-4.2, 1.8, -3.4);
scene.add(rimLight);

const warmFill = new THREE.PointLight(0xff9b57, 0.35, 32, 2);
warmFill.position.set(0, -1.2, -8);
scene.add(warmFill);

const ship = new THREE.Group();

const hull = new THREE.Mesh(
  new THREE.BoxGeometry(0.92, 0.26, 0.58),
  new THREE.MeshStandardMaterial({
    color: 0x59c9ff,
    emissive: 0x0a375f,
    emissiveIntensity: 0.55,
    metalness: 0.52,
    roughness: 0.22,
  }),
);

const nose = new THREE.Mesh(
  new THREE.ConeGeometry(0.18, 0.38, 16),
  new THREE.MeshStandardMaterial({
    color: 0xd9f4ff,
    emissive: 0x1f5577,
    emissiveIntensity: 0.35,
    metalness: 0.3,
    roughness: 0.25,
  }),
);
nose.rotation.x = Math.PI * 0.5;
nose.position.set(0, 0, -0.44);

const canopy = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 14, 10),
  new THREE.MeshStandardMaterial({
    color: 0x7be5ff,
    emissive: 0x2a9cc5,
    emissiveIntensity: 0.42,
    metalness: 0.22,
    roughness: 0.15,
    transparent: true,
    opacity: 0.92,
  }),
);
canopy.scale.set(1.1, 0.7, 1);
canopy.position.set(0, 0.09, -0.06);

const wingMaterial = new THREE.MeshStandardMaterial({
  color: 0x2da8df,
  emissive: 0x103554,
  emissiveIntensity: 0.42,
  metalness: 0.45,
  roughness: 0.3,
});
const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.18), wingMaterial);
leftWing.position.set(-0.46, -0.03, 0.02);
const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.18), wingMaterial);
rightWing.position.set(0.46, -0.03, 0.02);

const thruster = new THREE.Mesh(
  new THREE.SphereGeometry(0.09, 12, 10),
  new THREE.MeshBasicMaterial({ color: 0xffa656, transparent: true, opacity: 0.9 }),
);
thruster.scale.set(0.8, 0.8, 0.6);
thruster.position.set(0, -0.01, 0.31);

ship.add(hull);
ship.add(nose);
ship.add(canopy);
ship.add(leftWing);
ship.add(rightWing);
ship.add(thruster);
scene.add(ship);

const environment = new EnvironmentCues({
  starCount: 1100,
  referenceCount: 6,
  size: 170,
  anchors: {
    band: {
      intensity: tuning.environment.galacticBandIntensity,
      width: tuning.environment.galacticBandWidth,
      tiltDeg: tuning.environment.galacticBandTiltDeg,
    },
    sun: {
      direction: tuning.environment.sunDirection,
      intensity: tuning.environment.sunIntensity,
      spriteSize: tuning.environment.sunSpriteSize,
      haloIntensity: tuning.environment.sunHaloIntensity,
    },
  },
});
scene.add(environment.group);

const world = new World();
const eventBus = new EventBus();
const scheduler = createSystemScheduler({ inputRoot: app, scene, camera });

const shipEntity = world.createEntity();
const shipTransform: Transform = {
  position: new THREE.Vector3(0, 0, 0),
  rotation: new THREE.Euler(0, 0, 0, 'YXZ'),
};
const shipVelocity: Velocity = {
  linear: new THREE.Vector3(),
};
const shipController: ShipController = {
  boostRemaining: 0,
  boostCooldown: 0,
  currentSpeed: 0,
  yawRate: 0,
  pitchRate: 0,
  wasBoostPressed: false,
  lookXSmoothed: 0,
  lookYSmoothed: 0,
};
const weaponSlots: WeaponSlots = {
  activeWeaponId: 'laser_mk1',
  cooldown: 0,
  heat: 0,
  overheated: false,
};
const autoTrace: AutoTrace = {
  enabled: false,
  targetId: null,
  strength: tuning.autoTrace.autoTraceStrength,
  stopAngleDeg: tuning.autoTrace.autoTraceStopAngleDeg,
  cancelLookThreshold: tuning.autoTrace.autoTraceCancelLookThreshold,
  lookX: 0,
  lookY: 0,
};
const targeting: Targeting = {
  currentTargetId: null,
  currentTargetInWindow: false,
  lockProgress: 0,
  lastSwitchTime: 0,
};
world.addComponent(shipEntity, RENDERABLE_COMPONENT, { mesh: ship });
world.addComponent(shipEntity, TRANSFORM_COMPONENT, shipTransform);
world.addComponent(shipEntity, VELOCITY_COMPONENT, shipVelocity);
world.addComponent(shipEntity, SHIP_CONTROLLER_COMPONENT, shipController);
world.addComponent(shipEntity, AUTO_TRACE_COMPONENT, autoTrace);
world.addComponent(shipEntity, WEAPON_SLOTS_COMPONENT, weaponSlots);
world.addComponent(shipEntity, TARGETING_COMPONENT, targeting);
world.addComponent(shipEntity, PLAYER_TAG_COMPONENT, {});

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

const stageEntity = world.createEntity();
const stageState: StageRunState = {
  status: 'Idle',
  stageId: 'stage_001',
  startTime: 0,
  spawnedEnemyIds: [],
  killedEnemies: 0,
  remainingEnemies: 0,
  creditsAwarded: 0,
  objectiveComplete: false,
};
world.addComponent(stageEntity, STAGE_RUNTIME_COMPONENT, stageState);

const economyEntity = world.createEntity();
const economyState: EconomyState = { credits: 0 };
world.addComponent(economyEntity, ECONOMY_COMPONENT, economyState);

const hitMarkerEntity = world.createEntity();
const hitMarker: HitMarker = { timer: 0 };
world.addComponent(hitMarkerEntity, HIT_MARKER_COMPONENT, hitMarker);

const envToggleButton = document.createElement('button');
envToggleButton.className = 'env-toggle';
envToggleButton.type = 'button';
envToggleButton.textContent = 'ENV On';
envToggleButton.dataset.active = 'true';
const inputOverlay = document.getElementById('input-overlay') ?? app;
if (inputOverlay !== app) {
  suppressGestures(inputOverlay);
}
inputOverlay.appendChild(envToggleButton);

const anchorToggleButton = document.createElement('button');
anchorToggleButton.className = 'env-toggle anchor-toggle';
anchorToggleButton.type = 'button';
anchorToggleButton.textContent = 'Anchors On';
anchorToggleButton.dataset.active = 'true';
inputOverlay.appendChild(anchorToggleButton);

const bandToggleButton = document.createElement('button');
bandToggleButton.className = 'env-toggle band-toggle';
bandToggleButton.type = 'button';
bandToggleButton.textContent = 'Band On';
bandToggleButton.dataset.active = 'true';
inputOverlay.appendChild(bandToggleButton);

const sunToggleButton = document.createElement('button');
sunToggleButton.className = 'env-toggle sun-toggle';
sunToggleButton.type = 'button';
sunToggleButton.textContent = 'Sun On';
sunToggleButton.dataset.active = 'true';
inputOverlay.appendChild(sunToggleButton);

const toggleEnvironment = (): void => {
  const enabled = environment.toggle();
  envToggleButton.dataset.active = enabled ? 'true' : 'false';
  envToggleButton.textContent = enabled ? 'ENV On' : 'ENV Off';
};

const toggleAnchors = (): void => {
  const enabled = environment.toggleAnchors();
  anchorToggleButton.dataset.active = enabled ? 'true' : 'false';
  anchorToggleButton.textContent = enabled ? 'Anchors On' : 'Anchors Off';
};

const toggleBand = (): void => {
  const enabled = environment.toggleBand();
  bandToggleButton.dataset.active = enabled ? 'true' : 'false';
  bandToggleButton.textContent = enabled ? 'Band On' : 'Band Off';
};

const toggleSun = (): void => {
  const enabled = environment.toggleSun();
  sunToggleButton.dataset.active = enabled ? 'true' : 'false';
  sunToggleButton.textContent = enabled ? 'Sun On' : 'Sun Off';
};

envToggleButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
});
envToggleButton.addEventListener('pointerup', (event) => {
  event.preventDefault();
  toggleEnvironment();
});

anchorToggleButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
});
anchorToggleButton.addEventListener('pointerup', (event) => {
  event.preventDefault();
  toggleAnchors();
});

bandToggleButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
});
bandToggleButton.addEventListener('pointerup', (event) => {
  event.preventDefault();
  toggleBand();
});

sunToggleButton.addEventListener('pointerdown', (event) => {
  event.preventDefault();
});
sunToggleButton.addEventListener('pointerup', (event) => {
  event.preventDefault();
  toggleSun();
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'e' || event.key === 'E') {
    toggleEnvironment();
  }

  if (event.key === 'F3') {
    const visible = debugOverlay.dataset.visible !== 'true';
    debugOverlay.dataset.visible = visible ? 'true' : 'false';
    debugOverlay.style.display = visible ? 'block' : 'none';
    document.body.dataset.debugMode = visible ? 'true' : 'false';
  }
});

const debugOverlay = document.createElement('div');
debugOverlay.id = 'debug-overlay';
debugOverlay.textContent = 'FPS: --\nFrame: -- ms';
const debugOverlayEnabledByDefault = new URLSearchParams(window.location.search).get('debug') === '1';
document.body.dataset.debugMode = debugOverlayEnabledByDefault ? 'true' : 'false';
debugOverlay.dataset.visible = debugOverlayEnabledByDefault ? 'true' : 'false';
if (!debugOverlayEnabledByDefault) {
  debugOverlay.style.display = 'none';
}
app.appendChild(debugOverlay);

const loadingOverlay = document.createElement('div');
loadingOverlay.id = 'loading-overlay';
loadingOverlay.textContent = 'Loading content...';
app.appendChild(loadingOverlay);

const maxFrameMs = 50;
let lastTime = performance.now();
let fpsAccumulator = 0;
let fpsFrames = 0;
const renderables: EntityId[] = [];
const enemyEntities: EntityId[] = [];
const cameraOffset = new THREE.Vector3(0, 0.12, 0.25);
const cameraOffsetWorld = new THREE.Vector3();
const cameraQuat = new THREE.Quaternion();
let context: GameContext | null = null;

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

const stepFrame = (frameMs: number): void => {
  const clampedMs = Math.min(frameMs, maxFrameMs);
  const dt = clampedMs / 1000;

  if (!context) {
    return;
  }

  scheduler.update(context, dt);
  environment.update(shipTransform, dt, shipController.boostRemaining > 0);

  const boostPulse = shipController.boostRemaining > 0
    ? 1 + Math.sin(performance.now() * 0.02) * 0.08
    : 1;
  thruster.scale.set(0.8 * boostPulse, 0.8 * boostPulse, 0.6 * boostPulse);
  const thrusterMaterial = thruster.material as THREE.MeshBasicMaterial;
  thrusterMaterial.opacity = shipController.boostRemaining > 0 ? 1 : 0.75;

  world.query([RENDERABLE_COMPONENT, TRANSFORM_COMPONENT], renderables);
  for (const entityId of renderables) {
    const renderable = world.getComponent(entityId, RENDERABLE_COMPONENT);
    const transform = world.getComponent(entityId, TRANSFORM_COMPONENT);

    if (!renderable || !transform) {
      continue;
    }

    renderable.mesh.position.copy(transform.position);
    renderable.mesh.rotation.copy(transform.rotation);

    if (entityId === shipEntity) {
      cameraQuat.setFromEuler(transform.rotation);
      cameraOffsetWorld.copy(cameraOffset).applyQuaternion(cameraQuat);
      camera.position.copy(transform.position).add(cameraOffsetWorld);
      camera.quaternion.copy(cameraQuat);
    }
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
    const speedLabel = `Speed: ${shipController.currentSpeed.toFixed(2)}`;
    const boostTimeLabel = `Boost Time: ${shipController.boostRemaining.toFixed(2)}s`;
    const cooldownLabel = `Boost CD: ${shipController.boostCooldown.toFixed(2)}s`;
    const lookModeLabel =
      inputState.mode === 'gyro'
        ? `Look Sens: ${tuning.look.lookSensitivityGyro.toFixed(2)}`
        : `Look Sens: ${tuning.look.lookSensitivityTouch.toFixed(2)}`;
    const lookSmoothLabel = `Look Smooth: ${tuning.look.lookSmoothing.toFixed(2)}`;
    debugOverlay.textContent = `FPS: ${fps.toFixed(1)}\nFrame: ${avgFrameMs.toFixed(1)} ms\n${inputLabel}\n${lookLabel}\n${actionLabel}\n${boostLabel}\n${speedLabel}\n${boostTimeLabel}\n${cooldownLabel}\n${lookModeLabel}\n${lookSmoothLabel}`;
    fpsAccumulator = 0;
    fpsFrames = 0;
  }
};

const tick = (now: number) => {
  const frameMs = now - lastTime;
  lastTime = now;
  stepFrame(frameMs);
  window.requestAnimationFrame(tick);
};

type GameDebugWindow = Window & {
  render_game_to_text?: () => string;
  advanceTime?: (ms: number) => void;
};

const gameDebugWindow = window as GameDebugWindow;
gameDebugWindow.render_game_to_text = () => {
  world.query([ENEMY_TAG_COMPONENT, TRANSFORM_COMPONENT], enemyEntities);

  const enemies = enemyEntities.slice(0, 24).map((entityId) => {
    const transform = world.getComponent(entityId, TRANSFORM_COMPONENT);
    return transform
      ? {
          id: entityId,
          x: Number(transform.position.x.toFixed(2)),
          y: Number(transform.position.y.toFixed(2)),
          z: Number(transform.position.z.toFixed(2)),
        }
      : null;
  }).filter((entry): entry is { id: number; x: number; y: number; z: number } => entry !== null);

  const payload = {
    coordinateSystem: 'threejs-world (x:right, y:up, z:forward-negative)',
    player: {
      x: Number(shipTransform.position.x.toFixed(2)),
      y: Number(shipTransform.position.y.toFixed(2)),
      z: Number(shipTransform.position.z.toFixed(2)),
      yaw: Number(shipTransform.rotation.y.toFixed(3)),
      pitch: Number(shipTransform.rotation.x.toFixed(3)),
      speed: Number(shipController.currentSpeed.toFixed(2)),
      boostRemainingSec: Number(shipController.boostRemaining.toFixed(2)),
    },
    stage: {
      id: stageState.stageId,
      status: stageState.status,
      remainingEnemies: stageState.remainingEnemies,
      killedEnemies: stageState.killedEnemies,
    },
    controls: {
      mode: inputState.mode,
      moveX: Number(inputState.moveX.toFixed(2)),
      moveY: Number(inputState.moveY.toFixed(2)),
      lookX: Number(inputState.lookX.toFixed(2)),
      lookY: Number(inputState.lookY.toFixed(2)),
      firePrimary: inputState.firePrimary,
      fireSecondary: inputState.fireSecondary,
      boost: inputState.boost,
    },
    enemies,
  };

  return JSON.stringify(payload);
};

gameDebugWindow.advanceTime = (ms: number) => {
  if (!context) {
    return;
  }

  const stepMs = 1000 / 60;
  const steps = Math.max(1, Math.round(ms / stepMs));
  for (let i = 0; i < steps; i += 1) {
    stepFrame(stepMs);
  }
};

const boot = async (): Promise<void> => {
  const loader = new ContentLoader();
  try {
    const content = await loader.loadAll();
    context = { world, eventBus, events: eventBus.peek(), tuning, content };
    console.info('[Content] Loaded', content);
    loadingOverlay.remove();
    scheduler.init(context);
    window.requestAnimationFrame(tick);
  } catch (error) {
    console.error(error);
    loadingOverlay.textContent = 'Content load failed. See console.';
  }
};

void boot();
