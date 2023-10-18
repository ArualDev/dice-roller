import * as THREE from 'three';
import * as CANNON from 'cannon-es'
import { clamp } from './mathUtils';
import { syncModelWithBody, trimeshFromGeometry, waitSeconds } from './utils';
import { easeOutElastic } from './animFunctions';

export default class Dice {
    model: THREE.Group<THREE.Object3DEventMap>;
    mesh: THREE.Mesh;
    body: CANNON.Body;
    sides: Map<THREE.Object3D, number>;

    startAnimT = 0;

    constructor(model: THREE.Group<THREE.Object3DEventMap>) {
        this.model = model;
        this.mesh = this.getMesh();
        this.body = this.createBody();
        this.sides = this.getDiceSides();
    }

    getMesh() {
        let mesh: THREE.Mesh | undefined;
        this.model.traverse(o => {
            if (o.type === 'Mesh')
                mesh = (o as THREE.Mesh);
        })
        if (!mesh)
            throw new Error('No mesh found');
        mesh.castShadow = true;
        return mesh;
    }

    createBody() {
        const trimesh = trimeshFromGeometry(this.mesh.geometry);
        const body = new CANNON.Body({ mass: 1, shape: trimesh })
        body.position.y = 0.5;
        body.material = new CANNON.Material({
            friction: 0,
            restitution: 1
        });
        return body;
    }

    getDiceSides() {
        const sides = new Map<THREE.Object3D, number>();
        this.model.traverse(o => {
            const matches = o.name.match(/FACE_(\d{1,4})/);
            if (!matches)
                return;
            const sideID = Number(matches[1]);
            if (isNaN(sideID))
                return;
            sides.set(o as THREE.Object3D, sideID)
        })
        return sides;
    }

    getCurrentSideUp() {
        let maxHeight = -Infinity;
        let maxHeightSideID = 0;

        for (const [side, sideID] of this.sides) {
            const pos = new THREE.Vector3();
            side.getWorldPosition(pos);

            if (pos.y > maxHeight) {
                maxHeight = pos.y;
                maxHeightSideID = sideID;
            }
        }
        return maxHeightSideID
    }

    waitForStop() {
        return new Promise<void>((resolve, reject) => {
            const dice = this;
            function animateListener() {
                const threshold = 0.05;
                const thresholdSquared = threshold * threshold;

                if (dice.body.velocity.lengthSquared() > thresholdSquared || dice.body.angularVelocity.lengthSquared() > thresholdSquared)
                    return;
                removeEventListener('animate', animateListener);
                resolve();
            }
            addEventListener('animate', animateListener);
        })
    }

    async roll() {
        this.body.position = new CANNON.Vec3(0, 5, 0)
        this.body.velocity = new CANNON.Vec3(0, 0, -10);
        this.body.angularVelocity = new CANNON.Vec3();
        const randQuaternion = new THREE.Quaternion().random();
        this.body.quaternion.set(randQuaternion.x, randQuaternion.y, randQuaternion.z, randQuaternion.w);
        this.startAnimT = 0;

        const randVelMult = 20;

        this.body.angularVelocity = new CANNON.Vec3(
            THREE.MathUtils.randFloatSpread(1) - 0.5,
            THREE.MathUtils.randFloatSpread(1),
            THREE.MathUtils.randFloatSpread(1),
        ).scale(randVelMult);

        // Proceeds when the dice stops or when the roll time exceeds its time limit
        await Promise.any([this.waitForStop(), waitSeconds(10)]);
        return this.getCurrentSideUp();
    }

    update(dt: number) {
        if (this.startAnimT < 1) {
            this.startAnimT = clamp(0, 1, this.startAnimT + dt / 0.8);
            const scale = 0.2 + easeOutElastic(this.startAnimT) * 0.8;
            this.model.scale.set(scale, scale, scale);
        }

        syncModelWithBody(this.model, this.body)
    }

}