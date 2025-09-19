import React, { useEffect, useRef } from "react";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from "three";

export default function Home() {
	const mountRef = useRef<HTMLDivElement>(null);
	const planetRef = useRef<THREE.Object3D | null>(null);

	useEffect(() => {
		if (!mountRef.current) return;

		mountRef.current.innerHTML = "";

		// Création de la scène
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ antialias: true });

		renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
		mountRef.current.appendChild(renderer.domElement);

		const loader = new GLTFLoader();
		// Lumière directionnelle
		const light = new THREE.DirectionalLight(0xffffff, 0.3);
		light.position.set(2, 2, 5);
		scene.add(light);

		// Lumière ambiante (faible, douce)
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
		scene.add(ambientLight);

		loader.load(
			'/models/scene.gltf', // URL publique
			(gltf) => {
				scene.add(gltf.scene);

				const planet = gltf.scene.getObjectByName("Planet") as THREE.Object3D;
				const items  = ["CameraObj","BookObj","LaptopObj"]; // noms exacts à adapter
				items.forEach((name) => {
					const child = gltf.scene.getObjectByName(name);
					if (child && planet) planet.attach(child); // conserve la pose monde
				});

				const expCam = gltf.cameras?.[0] as THREE.PerspectiveCamera | undefined;
				if (expCam) {
					camera.position.copy(expCam.getWorldPosition(new THREE.Vector3()));
					camera.quaternion.copy(expCam.getWorldQuaternion(new THREE.Quaternion()));
					if (expCam instanceof THREE.PerspectiveCamera) {
							camera.fov = expCam.fov;
							camera.near = expCam.near;
							camera.far  = expCam.far;
							camera.updateProjectionMatrix();
					}
					controls.update();
				}

				// position
				// console.log("gltf.scene")
				// console.log(gltf.scene.children[0].children)
				// let a = (gltf.scene.children[0].children.find(e => e.name == "Water"))
				// console.log(a, a.position)
				camera.position.set(0.3, 2, 5);      // x lateral move ,y height,z distance w planet

				camera.rotation.set(0, 0, 0);

				camera.fov = 40;                   // plus petit = plus serré
				camera.updateProjectionMatrix();
			},
			undefined,
			(error) => {
				console.error("Erreur lors du chargement du modèle :", error);
			}
		);

		// const gridHelper = new THREE.GridHelper(10, 10);
		// scene.add(gridHelper);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = false;

		// scroll -> pivot planet
		let targetRotY = 0;
		const speed = 0.15;

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			console.log("onwheel listener")
			const dir = Math.sign(e.deltaY);
			targetRotY += -dir * speed; // inverser si besoin
		}

		const animate = () => {
			requestAnimationFrame(animate);
			if (planetRef.current) {
				// rotation douce
				console.log("rotation animate")
				const current = planetRef.current.rotation.y;
				planetRef.current.rotation.y += (targetRotY - current) * 0.08;
			}
			renderer.render(scene, camera);
		};
		animate();

;

		renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

		controls.enableRotate = false; // interdit rotation
		controls.enablePan = false;
		controls.enableZoom = false;         // (par défaut true)
		controls.zoomSpeed = 1.0;            // accélère/ralentit le zoom
		controls.minDistance = 0.5;          // distance mini caméra–cible
		controls.maxDistance = 50;           // distance maxi
		controls.update();


		// Cleanup
		return () => {
			mountRef.current?.removeChild(renderer.domElement);
			renderer.domElement.removeEventListener("wheel", onWheel);
		};
	}, []);

	return (
		<div style={{ width: "100%", height: "100vh", backgroundColor: "#000" }} ref={mountRef}>
		{/* Three.js canvas mounted ici */}
		</div>
	);
}
