import { Controller } from "@hotwired/stimulus"
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

// Connects to data-controller="threejs"
export default class extends Controller {
  connect() {
    // const scrollDisplay = document.getElementById('scroll');
    let group;
    let container;
    const particlesData = [];
    let camera, scene, renderer;
    let positions, colors;
    let particles;
    let pointCloud;
    let particlePositions;
    let linesMesh;

    const maxParticleCount = 1000;
    let particleCount = 500;
    const r = 1000;
    const rHalf = r / 2;

    const effectController = {
      showDots: true,
      showLines: true,
      minDistance: 135,
      limitConnections: false,
      maxConnections: 20,
      particleCount: 500
    };

    const loader = new FontLoader();
    let fontPath = document.getElementById('container').dataset.fontPath;
    loader.load(fontPath,
      function (font) {
        const myText = new TextGeometry('Hugo PETAMENT', {
          font: font,
          size: 70,
          height: 5,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 10,
          bevelSize: 4,
          bevelOffset: 0,
          bevelSegments: 5
        });

        myText.computeBoundingBox();
        const textWidth = myText.boundingBox.max.x - myText.boundingBox.min.x;
        const buildingText = new TextGeometry('Under construction...', {
          font: font,
          size: 35,
          height: 2.5,
          curveSegments: 12,
          bevelEnabled: true,
          bevelThickness: 10,
          bevelSize: 4,
          bevelOffset: 0,
          bevelSegments: 5
        });
        buildingText.computeBoundingBox();
        const textHeight = myText.boundingBox.max.y - myText.boundingBox.min.y;
        const buildingTextMesh = new THREE.Mesh(
          buildingText,
          new THREE.MeshStandardMaterial({
            color: 0xF1F1F1,
            roughness: 0,
            metalness: 1
          })
        )
        buildingTextMesh.position.set(-100, -textHeight / 2, 0);
        group.add(buildingTextMesh);
        // END OF TEMP TEXT

        const text = new THREE.Mesh(
          myText,
          new THREE.MeshStandardMaterial({
            color: 0xff0000,
            roughness: 0,
            metalness: 1
          })
        )
        text.position.set(-textWidth / 2, 0, 0);
        group.add(text);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 200);
        directionalLight.position.z = 6;
        directionalLight.position.x = 3;
        group.add(directionalLight);

        const directionalLightTwo = new THREE.DirectionalLight(0xffffff, 200);
        directionalLightTwo.position.z = 6;
        directionalLightTwo.position.x = 0;
        group.add(directionalLightTwo);

        const directionalLightThree = new THREE.DirectionalLight(0xffffff, 200);
        directionalLightThree.position.z = 6;
        directionalLightThree.position.x = -3;
        group.add(directionalLightThree);
      },

      // onProgress callback
      function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },

      // onError callback
      function (err) {
        console.log('An error happened');
      }
    );

    init();
    animate();

    function init() {
      container = document.getElementById('container');

      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000);
      camera.position.z = 600;

      const controls = new OrbitControls(camera, container);
      controls.mouseButtons.RIGHT = null;
      controls.enableZoom = false;

      scene = new THREE.Scene();

      group = new THREE.Group();
      scene.add(group);

      const segments = maxParticleCount * maxParticleCount;

      positions = new Float32Array(segments * 3);
      colors = new Float32Array(segments * 3);

      const pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
      });

      particles = new THREE.BufferGeometry();
      particlePositions = new Float32Array(maxParticleCount * 3);

      for (let i = 0; i < maxParticleCount; i++) {
        const x = Math.random() * r - r / 2;
        const y = Math.random() * r - r / 2;
        const z = Math.random() * r - r / 2;

        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;

        particlesData.push({
          velocity: new THREE.Vector3(-0.5 + Math.random(), -0.5 + Math.random(), -0.5 + Math.random()),
          numConnections: 0
        });
      }

      particles.setDrawRange(0, particleCount);
      particles.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3).setUsage(THREE.DynamicDrawUsage));

      pointCloud = new THREE.Points(particles, pMaterial);
      group.add(pointCloud);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
      geometry.computeBoundingSphere();
      geometry.setDrawRange(0, 0);

      const material = new THREE.LineBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        transparent: true
      });

      linesMesh = new THREE.LineSegments(geometry, material);
      group.add(linesMesh);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.useLegacyLights = false;

      container.appendChild(renderer.domElement);

      window.addEventListener('resize', onWindowResize);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      // scrollDisplay.innerText = scrollY;

      let vertexpos = 0;
      let colorpos = 0;
      let numConnected = 0;

      for (let i = 0; i < particleCount; i++)
        particlesData[i].numConnections = 0;

      for (let i = 0; i < particleCount; i++) {
        const particleData = particlesData[i];

        particlePositions[i * 3] += particleData.velocity.x;
        particlePositions[i * 3 + 1] += particleData.velocity.y;
        particlePositions[i * 3 + 2] += particleData.velocity.z;

        if (particlePositions[i * 3 + 1] < -rHalf || particlePositions[i * 3 + 1] > rHalf)
          particleData.velocity.y = -particleData.velocity.y;

        if (particlePositions[i * 3] < -rHalf || particlePositions[i * 3] > rHalf)
          particleData.velocity.x = -particleData.velocity.x;

        if (particlePositions[i * 3 + 2] < -rHalf || particlePositions[i * 3 + 2] > rHalf)
          particleData.velocity.z = -particleData.velocity.z;

        if (effectController.limitConnections && particleData.numConnections >= effectController.maxConnections)
          continue;

        for (let j = i + 1; j < particleCount; j++) {
          const particleDataB = particlesData[j];
          if (effectController.limitConnections && particleDataB.numConnections >= effectController.maxConnections)
            continue;

          const dx = particlePositions[i * 3] - particlePositions[j * 3];
          const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
          const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < effectController.minDistance) {
            particleData.numConnections++;
            particleDataB.numConnections++;

            const alpha = 1.0 - dist / effectController.minDistance;

            positions[vertexpos++] = particlePositions[i * 3];
            positions[vertexpos++] = particlePositions[i * 3 + 1];
            positions[vertexpos++] = particlePositions[i * 3 + 2];

            positions[vertexpos++] = particlePositions[j * 3];
            positions[vertexpos++] = particlePositions[j * 3 + 1];
            positions[vertexpos++] = particlePositions[j * 3 + 2];

            colors[colorpos++] = alpha;
            colors[colorpos++] = alpha;
            colors[colorpos++] = alpha;

            colors[colorpos++] = alpha;
            colors[colorpos++] = alpha;
            colors[colorpos++] = alpha;

            numConnected++;
          }
        }
      }

      linesMesh.geometry.setDrawRange(0, numConnected * 2);
      linesMesh.geometry.attributes.position.needsUpdate = true;
      linesMesh.geometry.attributes.color.needsUpdate = true;

      pointCloud.geometry.attributes.position.needsUpdate = true;

      requestAnimationFrame(animate);
      render();
    }

    function render() {
      const time = Date.now() * 0.001;
      const rotationAngleX = Math.sin(time * 0.2) * Math.PI * 0.05;
      const rotationAngleZ = Math.cos(time * 0.15) * Math.PI * 0.1;
      const rotationAngleY = Math.sin(time * 0.1) * Math.PI * 0.03;
      group.rotation.y = rotationAngleY;
      group.rotation.x = rotationAngleX;
      group.rotation.z = rotationAngleZ;
      renderer.render(scene, camera);
    }
  }
}
