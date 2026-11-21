/**
 * Slim THREE catalogue for @react-three/fiber.
 *
 * R3F v9 calls `extend(THREE)` with the whole namespace, which defeats tree-shaking and
 * ships all of three.js (~730 KB minified). astro.config.mjs aliases `three` → this file
 * *only for imports coming from @react-three/fiber*, so R3F registers just what the
 * scenes use. Everything else in the app imports the real `three` (tree-shaken).
 *
 * If you add a new JSX element (e.g. <torusGeometry>), export its class here.
 */
export {
  // used internally by R3F
  ACESFilmicToneMapping, BasicShadowMap, Clock, Color, ColorManagement, Layers, LinearSRGBColorSpace,
  NoToneMapping, Object3D, OrthographicCamera, PCFShadowMap, PCFSoftShadowMap, PerspectiveCamera,
  RGBAFormat, Raycaster, SRGBColorSpace, Scene, ShaderMaterial, UnsignedByteType, VSMShadowMap,
  Vector2, Vector3, WebGLRenderer,
  // JSX elements used by the scenes (and drei's <RoundedBox>)
  Mesh, Group, InstancedMesh,
  BoxGeometry, PlaneGeometry, CylinderGeometry, RingGeometry, ExtrudeGeometry, ConeGeometry, CapsuleGeometry, SphereGeometry,
  MeshLambertMaterial, MeshBasicMaterial,
  HemisphereLight, DirectionalLight,
} from 'three';
