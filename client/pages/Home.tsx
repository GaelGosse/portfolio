import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
	const navigate = useNavigate();

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

		let cameraPosition = {
			x: -0.035, // + : camera go to R // - : camera go to L
			y: 2,
			z: 5,
		}
		let cameraRotation = {
			x: 0,
			y: 0,
			z: 0,
		}

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

		outlinePass.edgeStrength = 8;   // épaisseur
		outlinePass.edgeGlow = 0.5;
		outlinePass.edgeThickness = 1;

		outlinePass.visibleEdgeColor.set('#ffeeee');
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
			"Game_of_life",
			"Button"
		]);

		let hoveredObject: THREE.Object3D | null = null;

		let earth: THREE.Object3D | null = null;
		let button: THREE.Object3D | null = null;
		let button_frame: THREE.Object3D | null = null;
		let targetRotationY = 0;
		let currentRotationY = 0;

		let gameOfLife: THREE.Mesh | null = null;

		let gameOfLifeActive = false;
		let gameOfLifeTimer = 0;
		let gameOfLifeColors: Float32Array | null = null;

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
		const handleClickObject = (obj: THREE.Object3D) => {
			switch (obj.name) {
				case "Stadium":
					navigate("/stadium");
					break;
				case "Photo":
					window.location.href = "https://lpiewdprod.com";
					break;
				case "Shell":
					navigate("/minihell");
					break;
				case "Cube3D":
					navigate("/cube3D");
					break;
				case "Toolbox":
					navigate("/shell_function_n_shortcut");
					break;
				case "Game_of_life":
					navigate("/game_of_life");
					break;
				case "Button":
					gsap.to(button.position, {
						x: button.position.x,
						y: button.position.y + 0.035,
						z: button.position.z,
						duration: 0.15,
						ease: "power2.out",
					});
					setTimeout(() => {
						gsap.to(button.position, {
							x: button.position.x,
							y: button.position.y - 0.035,
							z: button.position.z,
							duration: 0.3,
							ease: "power2.out",
						});
					}, 200);
					setTimeout(() => {
						document.querySelector('#fade-overlay')?.classList.add('active');
						cameraPosition.y += 0.7
						gsap.to(camera.position, {
							x: cameraPosition.x,
							y: cameraPosition.y,
							z: cameraPosition.z,
							duration: 1,
							ease: "power2.out",
						});
					}, 750);
					setTimeout(() => {
						// window.location.href = "https://github.com/gaelgosse";
					}, 2500);
					break;

				default:
					break;
			}
		}

		const onClick = () => {
			raycaster.setFromCamera(mouse, camera);

			const intersections = raycaster.intersectObjects(
				scene.children,
				true
			);

			if (intersections.length === 0)
				return;

			const clickedObject = findInteractiveObject(
				intersections[0].object
			);

			if (!clickedObject)
				return;

			console.log("Clicked:", clickedObject.name);
			handleClickObject(clickedObject);
		};
		renderer.domElement.addEventListener("click", onClick);

		const onMouseMove = (event: MouseEvent) => {
			const rect = renderer.domElement.getBoundingClientRect();

			mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
			mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
		};
		renderer.domElement.addEventListener("mousemove", onMouseMove);

		let isSouth = false
		const onWheel = (event: WheelEvent) => {

			if (event.deltaY > 0) // scroll down && counterclockwise
			{
				if (targetRotationY < 6.1 && isSouth == false)
					targetRotationY += event.deltaY * 0.002;
				else if (targetRotationY < -6.1 && isSouth)
				{
					isSouth = false
					cameraRotation.x = 0
					cameraPosition.y = 2
					cameraPosition.z = 5
					gsap.to(camera.position, {
						x: cameraPosition.x,
						y: cameraPosition.y,
						z: cameraPosition.z,
						duration: 1.5,
						ease: "power2.out",
					});
					gsap.to(camera.rotation, {
						x: cameraRotation.x,
						y: cameraRotation.y,
						z: cameraRotation.z,
						duration: 1.5,
						ease: "power2.out",
					});
				}
				else {
					isSouth = true
					cameraRotation.x = 1.5
					cameraPosition.y = 0.1
					cameraPosition.z = 0.05
					gsap.to(camera.position, {
						x: cameraPosition.x,
						y: cameraPosition.y,
						z: cameraPosition.z,
						duration: 1.5,
						ease: "power2.out",
					});
					gsap.to(camera.rotation, {
						x: cameraRotation.x,
						y: cameraRotation.y,
						z: cameraRotation.z,
						duration: 1.5,
						ease: "power2.out",
					});
				}
			}
			else // scroll up && clockwise
			{
				if (targetRotationY > -6.1 && isSouth == false)
					targetRotationY += event.deltaY * 0.002;
				else if (targetRotationY > 6.1 && isSouth)
				{
					isSouth = false
					cameraRotation.x = 0
					cameraPosition.y = 2
					cameraPosition.z = 5
					gsap.to(camera.position, {
						x: cameraPosition.x,
						y: cameraPosition.y,
						z: cameraPosition.z,
						duration: 1.5,
						ease: "power2.out",
					});
					gsap.to(camera.rotation, {
						x: cameraRotation.x,
						y: cameraRotation.y,
						z: cameraRotation.z,
						duration: 1.5,
						ease: "power2.out",
					});
				}
				else {
					isSouth = true
					cameraRotation.x = 1.5
					cameraPosition.y = 0.1
					cameraPosition.z = 0.05
					gsap.to(camera.position, {
						x: cameraPosition.x,
						y: cameraPosition.y,
						z: cameraPosition.z,
						duration: 1.5,
						ease: "power2.out",
					});
					gsap.to(camera.rotation, {
						x: cameraRotation.x,
						y: cameraRotation.y,
						z: cameraRotation.z,
						duration: 1.5,
						ease: "power2.out",
					});
				}
			}
			// if (targetRotationY > - 6.1 &&
			// 	targetRotationY <  6.1)
			// 	targetRotationY += event.deltaY * 0.002;
			// else if (cameraRotation.x >= 0)
			// {
			// 	cameraRotation.x -= event.deltaY * 0.00015; // horizontal

			// 	if (cameraPosition.z > 0)
			// 		cameraPosition.z += event.deltaY * 0.0005; // depth
			// 	if (cameraPosition.y > 0.1)
			// 		cameraPosition.y += event.deltaY * 0.0002; // height
			// 	console.log("cameraPosition", cameraPosition);
			// 	console.log("cameraRotation", cameraRotation);
			// 	console.log("targetRotationY", targetRotationY);

			// 	console.log();

			// }
			console.log(targetRotationY, cameraPosition, cameraRotation, event.deltaY);
			console.log(isSouth);
			console.log();

		};
		renderer.domElement.addEventListener("wheel", onWheel, { passive: true, });

		/* --------------------------------------------------
		 * 5. LOAD MODEL
		 * -------------------------------------------------- */
		const loader = new GLTFLoader();
		loader.load(
			"/models/school12.glb",
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
				button = model.getObjectByName("Button");
				button_frame = model.getObjectByName("Button_Frame");

				if (earth) {
					const interactiveObjects = [
						"Stadium",
						"Photo",
						"Shell",
						"Cube3D",
						"Toolbox",
						"Game_of_life",
						"Button",
					];

					for (const name of interactiveObjects) {
						const object = model.getObjectByName(name);
						if (object)
							earth.add(object);
					}
				}

				gameOfLife = model.getObjectByName(
					"Game_of_life"
				) as THREE.Mesh;

				if (gameOfLife) {
					let geometry = gameOfLife.geometry as THREE.BufferGeometry;

					// Garantit que chaque triangle possède 3 vertices indépendants
					geometry = geometry.toNonIndexed();

					gameOfLife.geometry = geometry;

					const position = geometry.getAttribute("position");
					const vertexCount = position.count;

					gameOfLifeColors = new Float32Array(vertexCount * 3);

					// Initialisation : une couleur pour chaque triangle
					for (let i = 0; i < vertexCount; i += 3) {

						const color = Math.random() > 0.5 ? 1 : 0;

						for (let vertex = 0; vertex < 3; vertex++) {

							const index = (i + vertex) * 3;

							gameOfLifeColors[index] = color;
							gameOfLifeColors[index + 1] = color;
							gameOfLifeColors[index + 2] = color;
						}
					}

					geometry.setAttribute(
						"color",
						new THREE.BufferAttribute(gameOfLifeColors, 3)
					);

					const material = gameOfLife.material as THREE.MeshStandardMaterial;

					material.vertexColors = true;
					material.needsUpdate = true;
				}

				camera.position.set(
					cameraPosition.x,
					cameraPosition.y,
					cameraPosition.z,
				);
				camera.rotation.set(
					cameraRotation.x,
					cameraRotation.y,
					cameraRotation.z,
				);
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

		const animate = () => {
			animationFrameId = requestAnimationFrame(animate);
			if (earth) {
				currentRotationY += (targetRotationY - currentRotationY) * 0.08;
				earth.rotation.y = currentRotationY;
			}

			if (
				hoveredObject?.name === "Game_of_life" &&
				gameOfLife &&
				gameOfLifeColors
			) {

				const now = performance.now();

				if (now - gameOfLifeTimer >= 200) {
					gameOfLifeTimer = now;

					for (
						let i = 0;
						i < gameOfLifeColors.length;
						i += 9
					) {
						/*
						* Un triangle = 3 vertices = 9 valeurs.
						*
						* 15% des triangles changent d'état.
						*/
						if (Math.random() < 0.15) {
							const currentColor =
								gameOfLifeColors[i];

							const newColor =
								currentColor === 1
									? 0
									: 1;

							for (let j = 0; j < 9; j += 3) {
								gameOfLifeColors[i + j] =
									newColor;

								gameOfLifeColors[i + j + 1] =
									newColor;

								gameOfLifeColors[i + j + 2] =
									newColor;
							}
						}
					}

					const colorAttribute =
						gameOfLife.geometry.getAttribute(
							"color"
						) as THREE.BufferAttribute;

					colorAttribute.needsUpdate = true;
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
				renderer.domElement.style.cursor =
					hoveredObject
						? "pointer"
						: "default";

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
