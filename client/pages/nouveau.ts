import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";

export default function Home() {
	const mountRef = useRef<HTMLDivElement | null>(null);
	const planetRef = useRef<THREE.Object3D | null>(null);

	useEffect(() => {
		if (!mountRef.current)
			return;
		mountRef.current.innerHTML = "";

		/* --------------------------------------------------
		 * 1. INIT: scene, camera, renderer
		 * -------------------------------------------------- */
		const scene = new THREE.Scene();
		const width = mountRef.current.clientWidth;
		const height = mountRef.current.clientHeight;
		const camera = new THREE.PerspectiveCamera(
			75,
			width / height,
			0.1,
			1000
		);
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.setSize(width, height);
		mountRef.current.appendChild(renderer.domElement);
		const onResize = () => {
			if (!mountRef.current) return;
			const w = mountRef.current.clientWidth;
			const h = mountRef.current.clientHeight;

			renderer.setSize(w, h);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
		};
		window.addEventListener("resize", onResize);

		/* --------------------------------------------------
		 * 2. LIGHTS
		 * -------------------------------------------------- */
		const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
		dirLight.position.set(2, 2, 5);
		scene.add(dirLight);
		scene.add(new THREE.AmbientLight(0xffffff, 0.35));

		/* --------------------------------------------------
		 * 3. CONTROLS
		 * -------------------------------------------------- */
		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = false;
		controls.enableRotate = false;
		controls.enablePan = false;
		controls.enableZoom = false;

		/* --------------------------------------------------
		 * 4. RAYCASTER + MOUSE
		 * -------------------------------------------------- */
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();
		let hoveredObj: THREE.Object3D | null = null;
		let lastHovered: THREE.Object3D | null = null;

		const onMouseMove = (e: MouseEvent) => {
			const rect = renderer.domElement.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = (e.clientY - rect.top) / rect.height;
			mouse.x = x * 2 - 1;
			mouse.y = -(y * 2 - 1);
		};
		renderer.domElement.addEventListener("mousemove", onMouseMove);

		/* --------------------------------------------------
		 * 5. SCROLL → PLANET ROTATION
		 * -------------------------------------------------- */
		let targetRotY = 0;
		const scrollSpeed = 0.05;

		const onWheel = (e: WheelEvent) => {
			if (e.target !== renderer.domElement) return; // important: seulement si on est sur le canvas
			e.preventDefault();
			const dir = Math.sign(e.deltaY);
			targetRotY += -dir * scrollSpeed;
		};
		renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

		/* --------------------------------------------------
		 * 6. SURBRILLANCE AU HOVER
		 * -------------------------------------------------- */
		const setHighlight = (obj: THREE.Object3D, on: boolean) => {
			obj.traverse(child => {
				const mesh = child as THREE.Mesh;
				if (!(mesh as any).isMesh) return;
				const mat = mesh.material as any;
				if (!mat) return;

				if (on) {
					if (!mesh.userData._origEmissive) {
						mesh.userData._origEmissive = mat.emissive
							? mat.emissive.clone()
							: new THREE.Color(0x000000);
					}
					if (mat.emissive) {
						mat.emissive.setHex(0x666666);
					}
				} else {
					if (mesh.userData._origEmissive && mat.emissive) {
						mat.emissive.copy(mesh.userData._origEmissive);
					}
				}
			});
		};

		/* --------------------------------------------------
		 * 7. EFFECTS (enter / leave)
		 * -------------------------------------------------- */
		type EffectPhase = "enter" | "leave";
		type EffectFn = (obj: THREE.Object3D, phase: EffectPhase) => void;

		const effects: Record<string, EffectFn> = {
			Photo: (obj, phase) => {
				if (phase !== "enter")
					return;

				const flash = obj.userData.flash as THREE.PointLight | undefined;
				let light: THREE.PointLight;

				if (!flash) {
					light = new THREE.PointLight(0xffffff, 0, 5);
					obj.userData.flash = light;
					scene.add(light);
				} else {
					light = flash;
				}

				const worldPos = obj.getWorldPosition(new THREE.Vector3());
				light.position.copy(worldPos).add(new THREE.Vector3(0, 0.2, 0.5));

				// helper pour visualiser la position
				if (!obj.userData.flashHelper) {
					const helper = new THREE.PointLightHelper(light, 0.1);
					scene.add(helper);
					obj.userData.flashHelper = helper;
				}

				light.intensity = 6;
				setTimeout(() => {
					light.intensity = 0;
				}, 80);
			},
			Toolbox: (obj, phase) => {
				const pivot = obj.userData.lidPivot as THREE.Object3D | undefined;
				if (!pivot)
					return;

				const target = phase === "enter" ? -0.2 : 0;
				gsap.to(pivot.rotation, {
					x: target,
					duration: 0.3,
					ease: "power2.out",
				});
			},
			Stadium: (obj, phase) => {
				if (phase !== "enter")
					return;
				if (obj.userData.confettiActive)
					return;

				obj.userData.confettiActive = true;

				const geom = new THREE.BufferGeometry().setFromPoints(
					Array.from({ length: 200 }, () =>
						new THREE.Vector3(
							(Math.random() - 0.5) * 5,
							Math.random() * 2,
							(Math.random() - 0.5) * 5
						)
					)
				);
				const mat = new THREE.PointsMaterial({ color: 0xff0000, size: 0.05 });
				const confetti = new THREE.Points(geom, mat);
				obj.add(confetti);

				setTimeout(() => {
					obj.remove(confetti);
					geom.dispose();
					mat.dispose();
					obj.userData.confettiActive = false;
				}, 1200);
			},
			Cube3D: (obj, phase) => {
				const cube = obj.getObjectByName("Cube3D") as THREE.Object3D | null;
				if (!cube) return;

				const targetZ = phase === "enter" ? 0.2 : 0;
				gsap.to(cube.position, {
					z: targetZ,
					duration: 0.3,
					ease: "power2.out",
				});
			},
			Shell: (obj, phase) => {
				const target = phase === "enter" ? 0.15 : 0;
				gsap.to(obj.rotation, {
					z: target,
					duration: 0.4,
					ease: "power2.out",
				});
			},
		};

		/* --------------------------------------------------
		 * 8. LOAD MODEL
		 * -------------------------------------------------- */
		const interactiveNames = ["Stadium", "Photo", "Shell", "Cube3D", "Toolbox"];
		const loader = new GLTFLoader();

		loader.load(
			"/models/scene12.glb",
			(gltf) => {
				scene.add(gltf.scene);

				const planet = gltf.scene.getObjectByName("Earth") as THREE.Object3D | null;
				if (planet) {
					planetRef.current = planet;

					interactiveNames.forEach((name) => {
						const child = gltf.scene.getObjectByName(name);
						if (child) planet.add(child);
					});
				}

				// PIVOT TOOLBOX (couvercle)
				const toolbox = gltf.scene.getObjectByName("Toolbox") as THREE.Object3D | null;
				const lid = gltf.scene.getObjectByName("Cube007") as THREE.Object3D | null; // nom exact du couvercle

				if (toolbox && lid) {
					// position monde du couvercle
					const lidWorld = new THREE.Vector3();
					lid.getWorldPosition(lidWorld);

					const pivot = new THREE.Object3D();
					toolbox.add(pivot);

					// placer le pivot à la position du couvercle (en coords locales toolbox)
					pivot.position.copy(toolbox.worldToLocal(lidWorld.clone()));

					// re-parenter le couvercle au pivot en conservant sa pose
					pivot.add(lid);

					toolbox.userData.lidPivot = pivot;
				}
				camera.position.set(0.15, 2, 5);
				camera.rotation.set(0, 0, 0);
				camera.fov = 40;
				camera.updateProjectionMatrix();
			},
			undefined,
			(err) => {
				console.error("Erreur lors du chargement du modèle :", err);
			}
		);

		/* --------------------------------------------------
		 * 9. MAIN LOOP
		 * -------------------------------------------------- */
		const animate = () => {
			requestAnimationFrame(animate);

			// Raycast
			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObjects(scene.children, true);

			let newHover: THREE.Object3D | null = null;

			if (intersects.length > 0) {
				let obj = intersects[0].object as THREE.Object3D;

				// remonte si c'est un enfant d'un objet interactif
				while (obj.parent && !interactiveNames.includes(obj.name) && obj.parent.name !== "") {
					obj = obj.parent;
				}

				if (interactiveNames.includes(obj.name)) {
					newHover = obj;
				}
			}

			// gestion enter / leave
			if (newHover !== lastHovered) {
				// leave
				if (lastHovered) {
					setHighlight(lastHovered, false);
					const eff = effects[lastHovered.name];
					if (eff) eff(lastHovered, "leave");
				}
				// enter
				if (newHover) {
					setHighlight(newHover, true);
					const eff = effects[newHover.name];
					if (eff) eff(newHover, "enter");
				}
				lastHovered = newHover;
				hoveredObj = newHover;
			}

			// rotation planète vers targetRotY
			if (planetRef.current) {
				const p = planetRef.current;
				p.rotation.y += (targetRotY - p.rotation.y) * 0.12;
			}

			renderer.render(scene, camera);
		};
		animate();

		/* --------------------------------------------------
		 * 10. CLEANUP
		 * -------------------------------------------------- */
		return () => {
			window.removeEventListener("resize", onResize);
			renderer.domElement.removeEventListener("mousemove", onMouseMove);
			renderer.domElement.removeEventListener("wheel", onWheel);
			mountRef.current?.removeChild(renderer.domElement);
		};
	}, []);

	return (
		<div
			style={{ width: "100%", height: "100vh", backgroundColor: "#000" }}
			ref={mountRef}
		/>
	);
}
