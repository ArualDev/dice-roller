import * as THREE from 'three';
import * as CANNON from 'cannon-es'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { loadGLTF } from './utils';
import Dice from './Dice';

function createFloor() {
    const geometry = new THREE.PlaneGeometry(20, 20)
    const texture = new THREE.TextureLoader().load('floor-alpha.png');
    const material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x999999,
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
    light.position.set(0, 5, 0)
    light.castShadow = true;
    light.target.position.set(-1, 3, -1);
    return light;
}



export async function createScene(container: HTMLElement) {
    const camera = new THREE.PerspectiveCamera(40, undefined, 0.1, 200);
    
    const scene = new THREE.Scene();

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
    const pointLight = createLight();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);

    scene.add(floor);
    scene.add(dice.model);
    scene.add(pointLight)
    scene.add(pointLight.target)
    scene.add(ambientLight);
    camera.position.set(10, 10, 3)

    camera.lookAt(dice.model.position)

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

    const controls = new OrbitControls(camera, renderer.domElement);


    const onAnimate = new CustomEvent('animate')

    
    let lastFrameTime = 0;
    function animate(time: number = 0) {
        const deltaTime = time - lastFrameTime;
        requestAnimationFrame(animate);

        controls.update();
        physicsWorld.fixedStep();
        dice.update(deltaTime);
        renderer.render(scene, camera);

        dispatchEvent(onAnimate);

        lastFrameTime = time;
    }
    animate();

    async function rollDice() {
        return await dice.roll();
    }

    return rollDice;
}