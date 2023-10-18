import * as THREE from 'three';
import * as CANNON from 'cannon-es'
import { loadGLTF } from './utils';
import Dice from './Dice';


interface sceneTheme {
    backgroundColor: THREE.ColorRepresentation,
    floorColor: THREE.ColorRepresentation,
    floorEmission: THREE.ColorRepresentation
}

const lightTheme: sceneTheme = {
    backgroundColor: 0xffffff,
    floorColor: 0xffffff,
    floorEmission: 0x666666
}

const darkTheme: sceneTheme = {
    backgroundColor: 0x111111,
    floorColor: 0x444444,
    floorEmission: 0x000000
}

const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = isDarkMode ? darkTheme : lightTheme;

function createFloor() {
    const geometry = new THREE.PlaneGeometry(50, 50)
    const texture = new THREE.TextureLoader().load('floor-alpha.png');
    const material = new THREE.MeshStandardMaterial({
        color: theme.floorColor,
        emissive: theme.floorEmission,
        transparent: true,
        alphaMap: texture,
        side: THREE.DoubleSide
    });

    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, -0.01, 0);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    return mesh;
}

function createLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 50, 10)
    light.castShadow = true;
    light.target.position.set(0, 0, 0);
    light.shadow.camera.far = 100;
    return light;
}

export async function createScene(container: HTMLElement) {
    const camera = new THREE.PerspectiveCamera(40, undefined, 0.1, 200);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.backgroundColor)

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
    });
    renderer.shadowMap.enabled = true;

    function setDisplaySize() {
        const rect = container.getBoundingClientRect()
        const width = rect.width;
        const height = rect.height;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio)
    }

    setDisplaySize();
    window.addEventListener('resize', setDisplaySize);

    container.appendChild(renderer.domElement);

    const dice = new Dice((await loadGLTF('d-6.glb')).scene);
    const floor = createFloor();
    const directionalLight = createLight();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

    scene.add(floor, dice.model, directionalLight, directionalLight.target, ambientLight);

    camera.position.set(0, 15, 10)

    camera.lookAt(new THREE.Vector3())

    const physicsWorld = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0),
    })

    const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
    })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    physicsWorld.addBody(groundBody)
    physicsWorld.addBody(dice.body)


    const onAnimate = new CustomEvent('animate')

    const camOffset = camera.position.clone();

    let prevFrameTime = 0;
    function animate(time: number = 0) {
        const deltaTime = (time - prevFrameTime) / 1000;

        physicsWorld.fixedStep();
        dice.update(deltaTime);

        const targetPos = new THREE.Vector3(
            dice.model.position.x + camOffset.x,
            camOffset.y,
            dice.model.position.z + camOffset.z
        );

        camera.position.set(
            THREE.MathUtils.damp(camera.position.x, targetPos.x, 1, deltaTime),
            THREE.MathUtils.damp(camera.position.y, targetPos.y, 1, deltaTime),
            THREE.MathUtils.damp(camera.position.z, targetPos.z, 1, deltaTime)
        );
        floor.position.set(camera.position.x, floor.position.y, camera.position.z);

        directionalLight.position.set(dice.model.position.x, directionalLight.position.y, dice.model.position.z);
        directionalLight.target.position.set(directionalLight.position.x, 0, directionalLight.position.z);

        renderer.render(scene, camera);

        dispatchEvent(onAnimate);

        prevFrameTime = time;
        requestAnimationFrame(animate);
    };
    animate();

    async function rollDice() {
        camera.position.set(camOffset.x, camOffset.y, camOffset.z)
        return await dice.roll();
    }

    return rollDice;
}