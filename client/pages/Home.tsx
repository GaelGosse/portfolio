import React, { useEffect, useRef } from "react";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from "three";

export default function Home() {
	const mountRef = useRef<HTMLDivElement>(null);
	const planetRef = useRef<THREE.Object3D | null>(null);

	useEffect(() => {
		if (!mountRef.current)
			return;
		mountRef.current.innerHTML = "";

		/* --------------------------------------------------
		 * 1. INITIALISATION : scène, caméra, rendu
		 * -------------------------------------------------- */
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(
			75,
			mountRef.current.clientWidth / mountRef.current.clientHeight,
			0.1,
			1000);
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
		mountRef.current.appendChild(renderer.domElement);

		/* --------------------------------------------------
		 * 2. LUMIÈRES GLOBALES
		 * -------------------------------------------------- */
		const light = new THREE.DirectionalLight(0xffffff, 0.3);
		light.position.set(2, 2, 5);
		scene.add(light);
		scene.add(new THREE.AmbientLight(0xffffff, 0.35));

		/* --------------------------------------------------
		 * 3. CONTRÔLES ORBITAUX
		 * -------------------------------------------------- */
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = false;
		controls.enableRotate = false;       // interdit rotation
		controls.enablePan = false;
		controls.enableZoom = false;         // (par défaut true)
		controls.zoomSpeed = 1.0;            // accélère/ralentit le zoom
		controls.minDistance = 0.5;          // distance mini caméra–cible
		controls.maxDistance = 50;           // distance maxi
		controls.update();

		/* --------------------------------------------------
		 * 4. RAYCASTER (hover detection)
		 * -------------------------------------------------- */
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();
		let hoveredObj: THREE.Object3D | null = null;

		const onMouseMove = (e: MouseEvent) => {
			mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
		};
		renderer.domElement.addEventListener("mousemove", onMouseMove);

		/* --------------------------------------------------
		 * 5. ROTATION SCROLL
		 * -------------------------------------------------- */
		let targetRotY = 0;
		const speed = 0.15;

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const dir = Math.sign(e.deltaY);
			targetRotY += -dir * speed;
		}
		renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

		/* --------------------------------------------------
		 * 6. EFFETS INTERACTIFS
		 * -------------------------------------------------- */
		const effects: Record<string, (obj: THREE.Object3D) => void> = {
			Photo: (obj) => {
				const photo = obj.getObjectByName("Photo");
				if (!obj.userData.light)
				{
					const flash = new THREE.PointLight(0xffffff, 5, 5);
					let x_photo = photo?.position.x
					console.log(`🚀 ~ x_photo:`, x_photo);
					let y_photo = photo?.position.y
					console.log(`🚀 ~ y_photo:`, y_photo);
					let z_photo = photo?.position.z
					console.log(`🚀 ~ z_photo:`, z_photo);

					obj.add(flash);
					flash.position.set(y_photo, x_photo, z_photo );
					obj.userData.light = flash;
				}
				// animation du flash
				const light = obj.userData.light as THREE.PointLight;
				light.intensity = 100;
				setTimeout(() => {
					light.intensity = 0
				}, 100);
			},
			Toolbox: (obj) => {
				// Ouverture du couvercle
				const tlbx = obj.getObjectByName("Toolbox");
				console.log(obj.children)
				if (tlbx)
					tlbx.children[0].rotation.x -= 0.2;
			},
			Stadium: (obj) => {
				if (!obj.userData.confetti)
				{
					// Effet simple de confettis lumineux
					const confetti = new THREE.Points(
						new THREE.BufferGeometry().setFromPoints(
							Array.from({length: 200}, () =>
								new THREE.Vector3(
									(Math.random() - 0.5) * 5,
									Math.random() * 2,
									(Math.random() - 0.5) * 5
								)
							)
						),
						new THREE.PointsMaterial({ color: 0xff0000, size: 0.05 })
					);
					obj.add(confetti);
					obj.userData.confetti = confetti;
					setTimeout(() => {
						obj.remove(confetti)
						obj.userData.confetti = null;
					}, 500);
				}
			},
			Cube3D: (obj) => {
				if (!obj.userData.t)
					obj.userData.t = Math.PI;

				obj.userData.t += 0.04;
				const cube = obj.getObjectByName("Cube3D");
				if (cube)
				{
					console.log(`🚀 ~ obj.userData.t:`, obj.userData.t, Math.cos(obj.userData.t) * 0.05);
					cube.position.z = 0.05 + Math.cos(obj.userData.t) * 0.05;
					setTimeout(() => {
						cube.position.z = 0
					}, 1000);
				}
			}
		};

		/* --------------------------------------------------
		 * 7. CHARGEMENT DU MODÈLE
		 * -------------------------------------------------- */
		const items = ["Stadium", "Photo", "Shell", "Cube3D", "Toolbox"];
		const loader = new GLTFLoader();
		loader.load(
			'/models/scene12.glb', // URL publique
			(gltf) => {
				scene.add(gltf.scene);

				const planet = gltf.scene.getObjectByName("Earth") as THREE.Object3D;
				if (planet)
				{
					planetRef.current = planet;

					items.forEach((name) => {
						const child = gltf.scene.getObjectByName(name);
						if (child && planet)
							planet.add(child);
					});
				}

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

		/* --------------------------------------------------
		 * 8. ANIMATION PRINCIPALE
		 * -------------------------------------------------- */
		let s = new Set()
		const animate = () => {
			requestAnimationFrame(animate);

			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObjects(scene.children, true);

			if (intersects.length > 0)
			{
				// console.log(`🚀 ~ s:`, intersects[0].object.name, intersects[0].object.parent.name);

				const obj = intersects[0].object;
				if (hoveredObj !== obj)
				{
					if (hoveredObj)
						hoveredObj.userData.hover = false; // reset ancien
					if (obj && items.indexOf(obj.name) != -1)
					{
						hoveredObj = obj;
						obj.userData.hover = true;
						console.log("obj", hoveredObj.name)
					}
					else if (obj && obj.parent && items.indexOf(obj.parent.name) != -1)
					{
						hoveredObj = obj.parent;
						obj.parent.userData.hover = true;
						console.log("parent", hoveredObj.name)
					}
				}
			}
			else
			{
				if (hoveredObj)
					hoveredObj.userData.hover = false;
				hoveredObj = null;
			}

			if (hoveredObj && hoveredObj.userData.hover)
			{
				const effect = effects[hoveredObj.name];
				console.log("effect", hoveredObj.name, effects)
				if (effect)
					effect(hoveredObj);
				hoveredObj.userData.hover = false; // empêche de spammer en continu
			}

			// attend que le modèle soit prêt
			if (planetRef.current)
			{
				const current = planetRef.current.rotation.y;
				planetRef.current.rotation.y += (targetRotY - current) * 0.08;
			}
			renderer.render(scene, camera);

		};
		animate();

		/* --------------------------------------------------
		 * 9. CLEANUP (destruction propre)
		 * -------------------------------------------------- */
		return () =>
		{
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
