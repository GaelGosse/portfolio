import React, { useEffect, useRef } from "react";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Water } from 'three/examples/jsm/objects/Water2.js';
import * as THREE from "three";
import gsap from "gsap";

export default function Home() {
	const mountRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const mount = mountRef.current;

		if (!mount)
			return;

		/* --------------------------------------------------
		 * 1. SCENE
		 * -------------------------------------------------- */
		const scene = new THREE.Scene();
		const width = mount.clientWidth;
		const height = mount.clientHeight;
		const camera = new THREE.PerspectiveCamera(
			75,
			width / height,
			0.1,
			1000
		);

		const renderer = new THREE.WebGLRenderer({ antialias: true });

		renderer.outputColorSpace = THREE.SRGBColorSpace;
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1;

		renderer.setSize(mount.clientWidth, mount.clientHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		mount.appendChild(renderer.domElement);



		/* --------------------------------------------------
		 * 2. POST-PROCESSING
		* -------------------------------------------------- */
		const composer = new EffectComposer(renderer);

		const renderPass = new RenderPass(scene, camera);
		composer.addPass(renderPass);

		const outlinePass = new OutlinePass(
			new THREE.Vector2(width, height),
			scene,
			camera
		);

		outlinePass.edgeStrength = 2;   // épaisseur
		outlinePass.edgeGlow = 0.2;
		outlinePass.edgeThickness = 1;

		outlinePass.visibleEdgeColor.set('#ffffff');
		outlinePass.hiddenEdgeColor.set('#000000'); // invisible

		composer.addPass(outlinePass);

		const outputPass = new OutputPass();
		composer.addPass(outputPass);

		/* --------------------------------------------------
		 * 3. LIGHTS
		 * -------------------------------------------------- */
		const light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(2, 2, 5);
		scene.add(light);

		/* --------------------------------------------------
		 * 3 BIS. CONTROLS
		 * -------------------------------------------------- */
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = false;
		controls.enableRotate = false;
		controls.enablePan = false;
		controls.enableZoom = false;
		controls.zoomSpeed = 1.0;
		controls.enabled = false
		controls.minDistance = 0.5;
		controls.maxDistance = 50;
		controls.update();

		/* --------------------------------------------------
		 * 4. RAYCASTER / HOVER
		 * -------------------------------------------------- */
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();

		const interactiveNames = new Set([
			"Stadium",
			"Photo",
			"Shell",
			"Cube3D",
			"Toolbox",
		]);

		let hoveredObject: THREE.Object3D | null = null;

		let earth: THREE.Object3D | null = null;
		let targetRotation = 0;
		let currentRotation = 0;

		let randomWhite: THREE.Mesh | null = null;
		let randomBlack: THREE.Mesh | null = null;

		let randomAnimationStart = 0;
		let randomAnimationActive = false;

		const findInteractiveObject = (
			object: THREE.Object3D
		): THREE.Object3D | null => {
			let current: THREE.Object3D | null = object;

			while (current) {
				if (interactiveNames.has(current.name))
					return current;

				current = current.parent;
			}

			return null;
		};


		const onMouseMove = (event: MouseEvent) => {
			const rect = renderer.domElement.getBoundingClientRect();

			mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
		};


		renderer.domElement.addEventListener("mousemove", onMouseMove);
		const onWheel = (event: WheelEvent) => {
			targetRotation += event.deltaY * 0.002;
		};

		renderer.domElement.addEventListener("wheel", onWheel, {
			passive: true,
		});
		/* --------------------------------------------------
		 * 5. LOAD MODEL
		 * -------------------------------------------------- */
		const loader = new GLTFLoader();
		loader.load(
			"/models/school6.glb",
			(gltf) => {
				const model = gltf.scene;
				scene.add(model);

				const water = model.getObjectByName("Water");
				if (water instanceof THREE.Mesh) {
					water.material =
						new THREE.MeshPhysicalMaterial({
							color: 0x00ffff,
							transparent: true,
							opacity: 0.6,
							roughness: 0,
							metalness: 0.1,
							transmission: 0.35,
							thickness: 1,
						});
				}

				const planet = model.getObjectByName("Earth");
				earth = model.getObjectByName("Earth");

				if (earth) {
					const interactiveObjects = [
						"Stadium",
						"Photo",
						"Shell",
						"Cube3D",
						"Toolbox",
						"Random_white",
						"Random_black"
					];

					for (const name of interactiveObjects) {
						const object = model.getObjectByName(name);
						if (object)
							earth.add(object);
					}
				}

				randomWhite = model.getObjectByName("Random_white") as THREE.Mesh;
				randomBlack = model.getObjectByName("Random_black") as THREE.Mesh;

				camera.position.set(0.15, 2, 5);
				camera.rotation.set(0, 0, 0);
				camera.fov = 40;
				camera.updateProjectionMatrix();
			},
			undefined,

			(error) => {
				console.error(
					"Erreur lors du chargement du modèle :",
					error
				);
			}
		);

		/* --------------------------------------------------
		 * 6. RESIZE
		 * -------------------------------------------------- */
		const onResize = () => {
			if (!mountRef.current)
				return;

			const w = mountRef.current.clientWidth;
			const h = mountRef.current.clientHeight;

			renderer.setSize(w, h);
			renderer.setPixelRatio(
				Math.min(window.devicePixelRatio, 2)
			);

			camera.aspect = w / h;
			camera.updateProjectionMatrix();

			composer.setSize(w, h);
			outlinePass.setSize(w, h);
		};

		window.addEventListener("resize", onResize);

		/* --------------------------------------------------
		 * 7. RENDER LOOP
		 * -------------------------------------------------- */

		let animationFrameId: number;
		const animateRandomFaces = () => {
			if (!randomWhite || !randomBlack)
				return;

			randomAnimationStart = performance.now();
			randomAnimationActive = true;
		};

		const animate = () => {
			animationFrameId = requestAnimationFrame(animate);
			if (earth) {
				currentRotation += (targetRotation - currentRotation) * 0.08;
				earth.rotation.y = currentRotation;
			}

			if (randomAnimationActive) {
				const elapsed =
					performance.now() - randomAnimationStart;

				const duration = 400;

				const progress = Math.min(
					elapsed / duration,
					1
				);

				const whiteMaterial =
					randomWhite.material as THREE.MeshStandardMaterial;

				const blackMaterial =
					randomBlack.material as THREE.MeshStandardMaterial;

				whiteMaterial.color.lerpColors(
					new THREE.Color(0xffffff),
					new THREE.Color(0x000000),
					progress
				);

				blackMaterial.color.lerpColors(
					new THREE.Color(0x000000),
					new THREE.Color(0xffffff),
					progress
				);

				if (progress >= 1) {
					randomAnimationActive = false;
				}
			}

			raycaster.setFromCamera(mouse, camera);

			const intersections = raycaster.intersectObjects(
				scene.children,
				true
			);

			let newHoveredObject: THREE.Object3D | null = null;

			if (intersections.length > 0) {
				newHoveredObject = findInteractiveObject(
					intersections[0].object
				);
			}

			if (newHoveredObject !== hoveredObject) {
				hoveredObject = newHoveredObject;

				outlinePass.selectedObjects =
					hoveredObject
						? [hoveredObject]
						: [];

				if (hoveredObject?.name === "Random_white") {
					animateRandomFaces();
				}
			}

			composer.render();
		};

		animate();

		/* --------------------------------------------------
		 * 8. CLEANUP
		 * -------------------------------------------------- */

		return () => {
			cancelAnimationFrame(animationFrameId);

			window.removeEventListener("resize", onResize);

			renderer.domElement.removeEventListener(
				"mousemove",
				onMouseMove
			);

			renderer.domElement.removeEventListener(
				"wheel",
				onWheel
			);

			outlinePass.selectedObjects = [];

			composer.dispose();
			renderer.dispose();

			if (mount.contains(renderer.domElement))
				mount.removeChild(renderer.domElement);
		};


	}, []);

	return (
		<div style={{ width: "100%", height: "100vh", backgroundColor: "#000" }} ref={mountRef}>
		{/* Three.js canvas mounted ici */}
		</div>
	);
}
