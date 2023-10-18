import * as CANNON from 'cannon-es'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
export function loadGLTF(path: string) {
    return new Promise<GLTF>((resolve, reject) => {
        loader.load(path, data => resolve(data), undefined, reject);
    });
}

export function trimeshFromGeometry(geometry: THREE.BufferGeometry) {
    const vertices = (geometry.attributes.position as THREE.BufferAttribute).array
    const indices = Object.keys(vertices).map(Number)
    return new CANNON.Trimesh(vertices as unknown as number[], indices)
}

export function syncModelWithBody(model: THREE.Group<THREE.Object3DEventMap>, body: CANNON.Body) {
    model.position.set(body.position.x, body.position.y, body.position.z);
    model.quaternion.set(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w);
}

export function waitSeconds(seconds: number) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * 1000)
    });
}