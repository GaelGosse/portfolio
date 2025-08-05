import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Home() {
	const mountRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!mountRef.current) return;

		// Création de la scène
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ antialias: true });

		renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
		mountRef.current.appendChild(renderer.domElement);

		// Cube
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);

		camera.position.z = 2;

		// Animation
		const animate = () => {
			cube.rotation.x += 0.01;
			cube.rotation.y += 0.05;
			renderer.render(scene, camera);
			requestAnimationFrame(animate);
		};
		animate();

		// Cleanup
		return () => {
			mountRef.current?.removeChild(renderer.domElement);
		};
	}, []);

	return (
		// <div style={{ width: "100vw", height: "100vh", backgroundColor: "#000" }} ref={mountRef}>
		// 	{/* Three.js canvas mounted ici */}
		// </div>
		<nav>
			<a>Home</a>
			<a>Work</a>
			<a>Contact</a>
		</nav>
	);
}
