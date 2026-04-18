/**
 * raycast.js
 * ---------------------------------------------------------
 * Utility helpers for raycasting in the 3D city scene.
 *
 * NOTE: React Three Fiber handles raycasting automatically via
 * event props (onClick, onPointerOver, etc.) on <mesh> elements.
 * These utilities provide lower-level helpers for custom needs.
 * ---------------------------------------------------------
 */

import * as THREE from 'three';

/**
 * Extract building metadata from a raycaster intersection object.
 *
 * @param {THREE.Intersection} intersection
 * @returns {object|null} Building data or null if not a building
 */
export function getBuildingFromIntersection(intersection) {
  if (!intersection?.object) return null;

  const { userData } = intersection.object;
  if (userData?.id) {
    return {
      id: userData.id,
      name: userData.name,
      type: userData.type,
      route: userData.route,
      point: intersection.point.clone(),
      distance: intersection.distance,
      faceIndex: intersection.faceIndex,
    };
  }
  return null;
}

/**
 * Convert a DOM mouse / pointer event to normalised device coordinates.
 *
 * @param {MouseEvent|PointerEvent} event
 * @param {HTMLElement} domElement - the renderer's canvas
 * @returns {THREE.Vector2}
 */
export function getMouseNDC(event, domElement) {
  const rect = domElement.getBoundingClientRect();
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
}

/**
 * Create and configure a Raycaster from mouse NDC + camera.
 *
 * @param {THREE.Vector2} mouse - NDC coordinates
 * @param {THREE.Camera}  camera
 * @returns {THREE.Raycaster}
 */
export function createRaycaster(mouse, camera) {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  return raycaster;
}

/**
 * Walk an array of intersections and return the first building hit.
 *
 * @param {THREE.Intersection[]} intersections
 * @returns {object|null}
 */
export function findClosestBuilding(intersections) {
  for (const hit of intersections) {
    const bld = getBuildingFromIntersection(hit);
    if (bld) return bld;
  }
  return null;
}

/**
 * Perform a full raycast from screen coordinates and return
 * the closest building (if any).
 *
 * @param {MouseEvent}   event
 * @param {THREE.Camera} camera
 * @param {THREE.Scene}  scene
 * @param {HTMLElement}   canvas
 * @returns {object|null}
 */
export function raycastBuilding(event, camera, scene, canvas) {
  const mouse = getMouseNDC(event, canvas);
  const raycaster = createRaycaster(mouse, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  return findClosestBuilding(hits);
}
