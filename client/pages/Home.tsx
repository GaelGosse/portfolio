import React, { useEffect, useRef } from "react";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from "three";

export default function Home() {
	const mountRef = useRef<HTMLDivElement>(null);

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
					// controls.target.set(0,0,0); // ou un point de ton modèle
					controls.update();
				}

				// if (gltf.cameras && gltf.cameras.length > 0) {
				// 	const exportedCamera = gltf.cameras[0];
				// 	console.log("Caméra importée :", exportedCamera);

				// 	// Remplace la caméra par celle du modèle
				// 	if (exportedCamera && exportedCamera instanceof THREE.Camera) {
				// 		camera.position.copy(exportedCamera.position);
				// 		camera.quaternion.copy(exportedCamera.quaternion);
				// 		camera.updateProjectionMatrix();

				// 	}
				// }
			},
			undefined,
			(error) => {
				console.error("Erreur lors du chargement du modèle :", error);
			}
		);

		// const gridHelper = new THREE.GridHelper(10, 10);
		// scene.add(gridHelper);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;

		const animate = () => {
			requestAnimationFrame(animate);
			renderer.render(scene, camera);
		};
		animate();

		controls.enableZoom = true;          // (par défaut true)
		controls.zoomSpeed = 1.0;            // accélère/ralentit le zoom
		controls.minDistance = 0.5;          // distance mini caméra–cible
		controls.maxDistance = 50;           // distance maxi
		controls.update();


		// Cleanup
		return () => {
			mountRef.current?.removeChild(renderer.domElement);
		};
	}, []);

	return (
		<div style={{ width: "100vw", height: "100vh", backgroundColor: "#000" }} ref={mountRef}>
		{/* Three.js canvas mounted ici */}
		</div>
	);
}
