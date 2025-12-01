import React, { useEffect, useRef } from "react";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { Water } from 'three/examples/jsm/objects/Water2.js';
import * as THREE from "three";
import gsap from "gsap";

export default function Home() {
	const mountRef = useRef<HTMLDivElement>(null);
	const planetRef = useRef<THREE.Object3D | null>(null);

	useEffect(() => {
		if (!mountRef.current)
			return;
		mountRef.current.innerHTML = "";

		/* --------------------------------------------------
		 * 1. INIT: scene, camera, render
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
		renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
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

		// 1. composer = pipeline postprocessing
		const composer = new EffectComposer(renderer);

		// 2. render pass = rendu normal
		const renderPass = new RenderPass(scene, camera);
		composer.addPass(renderPass);

		// 3. outline pass
		const outlinePass = new OutlinePass(
			new THREE.Vector2(width, height),
			scene,
			camera
		);

		outlinePass.edgeStrength = 2;   // épaisseur
		outlinePass.edgeGlow = 0.2;
		outlinePass.edgeThickness = 1;
		outlinePass.visibleEdgeColor.set('#ffffff');
		outlinePass.hiddenEdgeColor.set('#00000000'); // invisible

		composer.addPass(outlinePass);


		/* --------------------------------------------------
		 * 2. LIGHTS
		 * -------------------------------------------------- */
		const light = new THREE.DirectionalLight(0xffffff, 3);
		light.position.set(2, 2, 5);
		scene.add(light);

		// let ambi = new THREE.AmbientLight(0xffffff, 2)
		// scene.add(ambi);

		let inte = 120000
		let sptl = new THREE.SpotLight(0xffffff, 100, 0)
		sptl.position.set(0, 5, .5)
		const target = new THREE.Object3D();
		target.position.set(0, 1, -1); // x z y
		scene.add(target);

		sptl.target = target;


		// scene.add(sptl);
		const helperSpt = new THREE.SpotLightHelper(sptl, 0.1);
		// scene.add(helperSpt)

		/* --------------------------------------------------
		 * 3. CONTROLS
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
		 * 4. RAYCASTER (hover detection)
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
		 * 5. PLANET ROTATION ON SCROLL
		 * -------------------------------------------------- */
		let targetRotY = 0;
		const speed = 0.1;

		const onWheel = (e: WheelEvent) => {
			if (e.target !== renderer.domElement) return;
			e.preventDefault();
			const dir = Math.sign(e.deltaY);
			targetRotY += -dir * speed;
		}
		renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

		/* --------------------------------------------------
		 * 6. EFFECTS
		 * -------------------------------------------------- */
		type EffectPhase = "enter" | "leave";
		type EffectFn = (obj: THREE.Object3D, phase: EffectPhase) => void;

		const effects: Record<string, EffectFn> = {
			Photo: (obj, phase) => {
				const photo = obj.getObjectByName("Photo");
				if (!obj.userData.light)
				{
					const flash = new THREE.PointLight(0xffffff, 5, 5);
					obj.add(flash);
					flash.position.set(
						photo?.position.y || 0,
						photo?.position.x || 0,
						photo?.position.z || 0
					);
					obj.userData.light = flash;
				}
				// animation du flash
				const light_s = obj.userData.light as THREE.PointLight;
				const helper = new THREE.PointLightHelper(light_s, 0.1);
				scene.add(helper);
				light_s.intensity = 100;
				setTimeout(() => {
					light_s.intensity = 0
				}, 50);
			},
			Toolbox: (obj, phase) => {
				const pivot = obj.userData.lidPivot;
				if (!pivot)
					return;
				const target = phase === "enter" ? -0.2 : 0;
				gsap.to(pivot.rotation, {
					x: 0.2,
					duration: 0.3,
					ease: "power2.out"
				});
			},
			Stadium: (obj, phase) => {
				if (phase == "enter")
					return ;
				if (obj.userData.confettiActive)
					return ;

				obj.userData.confettiActive = true;
				if (!obj.userData.confetti)
				{
					// Effet simple de confettis lumineux
					const confetti = new THREE.Points(
						new THREE.BufferGeometry().setFromPoints(
							Array.from({length: 200}, () =>
								new THREE.Vector3(
									(Math.random() - 0.5) * 5,
									(Math.random()) * 2,
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
						obj.userData.confettiActive = false;
					}, 1500);
				}
			},
			Cube3D: (obj) => {
				const cube = obj.getObjectByName("Cube3D");
				if (cube)
					gsap.to(cube.position, {
						z: 0.2,
						duration: 0.6,
						ease: "power2.out"
					});
			},
			Shell: (obj, phase) => {
				// const target = phase === "enter" ? 0.15 : 0;
				gsap.to(obj.rotation, {
					z: 0.15,
					duration: 0.4,
					ease: "power2.out",
				});
			},
		};

		/* --------------------------------------------------
		 * 7. LOAD MODEL
		 * -------------------------------------------------- */
		const items = ["Stadium", "Photo", "Shell", "Cube3D", "Toolbox"];
		const loader = new GLTFLoader();
		loader.load(
			// '/models/scene12.glb',
			'/models/school0.glb',
			(gltf) => {
				scene.add(gltf.scene);

				const planet = gltf.scene.getObjectByName("Earth") as THREE.Object3D;
				const ocean = gltf.scene.getObjectByName("Water") as THREE.Object3D;
				ocean.material.transparent = true;
				ocean.material.opacity = 0.7;

				ocean.material = new THREE.MeshPhysicalMaterial({
					color: 0x00ffff,
					transparent: true,
					opacity: 0.6,
					roughness: 0,
					metalness: 0.1,
					transmission: 0.35,
					thickness: 1,
				});

				if (planet)
				{
					planetRef.current = planet;

					items.forEach((name) => {
						const child = gltf.scene.getObjectByName(name);
						if (child && planet)
							planet.add(child);
					});
				}

				camera.position.set(0.15, 2, 5);      // x lateral move ,y height,z distance w planet
				camera.rotation.set(0, 0, 0);
				camera.fov = 30;                   // plus petit = plus serré
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
		 * 8. MAIN ANIMATE
		 * -------------------------------------------------- */
		let s = new Set()
		const animate = () => {
			requestAnimationFrame(animate);
			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObjects(scene.children, true);

			// hover : make no difference between children and parent
			if (intersects.length > 0)
			{
				const obj = intersects[0].object;
				if (obj && hoveredObj !== obj)
				{
					console.log(`🚀 ~ hoveredObj:`, hoveredObj);
					if (hoveredObj)
						hoveredObj.userData.hover = false; // reset ancien
					if (items.indexOf(obj.name) != -1)
					{
						hoveredObj = obj;
						obj.userData.hover = true;
					}
					else if (obj.parent && items.indexOf(obj.parent.name) != -1)
					{
						hoveredObj = obj.parent;
						obj.parent.userData.hover = true;
					}
					else if (obj.parent && obj.parent.parent && items.indexOf(obj.parent.parent.name) != -1)
					{
						hoveredObj = obj.parent.parent;
						obj.parent.parent.userData.hover = true;
					}
				}
			}
			else
			{
				if (hoveredObj)
					hoveredObj.userData.hover = false;
				hoveredObj = null;
			}

			// apply effects
			if (hoveredObj && hoveredObj.userData.hover)
			{
				outlinePass.selectedObjects = [hoveredObj];
				const effect = effects[hoveredObj.name];
				if (effect)
					effect(hoveredObj);
				hoveredObj.userData.hover = false; // empêche de spammer en continu
			}
			else
				outlinePass.selectedObjects = [];

			// wait model to be ready
			if (planetRef.current)
			{
				const current = planetRef.current.rotation.y;
				planetRef.current.rotation.y += (targetRotY - current) * 0.08;
			}
			renderer.render(scene, camera);
			// composer.render(scene)

		};
		animate();

		/* --------------------------------------------------
		 * 9. CLEANUP (destruction propre)
		 * -------------------------------------------------- */
		return () =>
		{
			window.removeEventListener("resize", onResize);
			renderer.domElement.removeEventListener("mousemove", onMouseMove);
			renderer.domElement.removeEventListener("wheel", onWheel);
			mountRef.current?.removeChild(renderer.domElement);
		};
	}, []);

	return (
		<div style={{ width: "100%", height: "100vh", backgroundColor: "#000" }} ref={mountRef}>
		{/* Three.js canvas mounted ici */}
		</div>
	);
}
