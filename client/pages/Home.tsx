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
		camera.position.set(0, 1, 5);

		loader.load(
			'/models/scene7.glb', // URL publique
			(gltf) => {
				scene.add(gltf.scene);
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

		// Cleanup
		return () => {
			mountRef.current?.removeChild(renderer.domElement);
		};
	}, []);

	return (
		<nav>
			<a>Home</a>
			<a>Work</a>
			<a>Contact</a>
			<div style={{ width: "100vw", height: "100vh", backgroundColor: "#000" }} ref={mountRef}>
			{/* Three.js canvas mounted ici */}
			</div>
		</nav>
	);
}
