import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const host = document.querySelector('[data-logo-scene]');
if (host) {
  const showcase = host.dataset.logoMode === 'showcase';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.append(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
    camera.position.z = showcase ? 5.4 : 12;
    scene.add(new THREE.HemisphereLight(0xc3eaff, 0x132c48, 2.5));
    const key = new THREE.DirectionalLight(0xe8f8ff, 3);
    key.position.set(3, 4, 7);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x46aaff, 2);
    rim.position.set(-4, 2, -2);
    scene.add(rim);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const logos = [];
    const waves = [];
    let halfWidth = 8, halfHeight = 5;
    const anchors = showcase ? [[.5, .5, 1.35]] : [
      [.84, .48, 1.05], [.15, .15, .36], [.94, .13, .43],
      [.37, .83, .38], [.72, .90, .6], [.52, .22, .35], [.08, .66, .44]
    ];
    for (let index = 0; index < 4; index++) {
      const positions = [];
      for (let step = 0; step <= 100; step++) {
        const x = step / 100 * 32 - 16;
        positions.push(x, Math.sin(x * .18 + index * .22) * 1.1 - 2.5, -2 - index * .3);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0x67c9ed, transparent: true, opacity: .10 + index * .035 }));
      scene.add(line);
      waves.push(line);
    }
    const points = [];
    for (let index = 0; index < 65; index++) {
      points.push(Math.sin(index * 12.7) * 15, Math.cos(index * 8.3) * 7, -4);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xa3dcff, size: .025, transparent: true, opacity: .42 }));
    scene.add(particles);
    const updateTheme = () => {
      const theme = document.documentElement.dataset.timeTheme;
      const color = theme === 'morning' ? 0xffdc70 : theme === 'night' ? 0x7397b5 : 0x67c9ed;
      key.color.setHex(theme === 'morning' ? 0xffe3ab : 0xe8f8ff);
      waves.forEach(wave => wave.material.color.setHex(color));
      particles.material.color.setHex(color);
      renderer.render(scene, camera);
    };
    document.addEventListener('skago-themechange', updateTheme);
    const draw = () => { if (!document.hidden) renderer.render(scene, camera); };
    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
      halfWidth = halfHeight * camera.aspect;
      logos.forEach(({group, anchor}) => group.position.set((anchor[0] - .5) * halfWidth * 2, (.5 - anchor[1]) * halfHeight * 2, 0));
      draw();
    };
    new ResizeObserver(resize).observe(host);
    let elapsed = 0, previous = 0;
    const animate = now => {
      if (document.hidden) return;
      if (previous) elapsed += Math.min((now - previous) / 1000, .05);
      previous = now;
      logos.forEach(({group, anchor}, index) => {
        group.position.x = (anchor[0] - .5) * halfWidth * 2 + Math.sin(elapsed * .10 + index * 1.7) * .35;
        group.position.y = (.5 - anchor[1]) * halfHeight * 2 + Math.sin(elapsed * .16 + index) * .40;
        group.rotation.set(Math.sin(elapsed * .10 + index) * .25, Math.sin(elapsed * (showcase ? .38 : .12) + index * .8) * (showcase ? .75 : .55), Math.sin(elapsed * .06 + index) * .18);
        group.userData.pulse = Math.max(0, (group.userData.pulse || 0) - .025);
        const pulse = group.userData.pulse;
        group.scale.setScalar(anchor[2] * (1 + pulse * .16));
        group.rotation.z += Math.sin(pulse * Math.PI) * .18;
        group.traverse(node => {
          if (!node.isMesh) return;
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach(material => {
            material.opacity = Math.min(1, material.userData.baseOpacity + pulse * .3);
          });
        });
      });
      waves.forEach((wave, index) => {
        wave.position.y = Math.sin(elapsed * .12 + index * .3) * .24;
        wave.material.opacity = .09 + index * .03 + Math.sin(elapsed * .18 + index) * .02;
      });
      particles.rotation.z = Math.sin(elapsed * .025) * .025;
      draw();
    };
    const updateAnimation = () => {
      previous = 0;
      renderer.setAnimationLoop(!document.hidden && !reduced.matches ? animate : null);
      draw();
    };
    document.addEventListener('visibilitychange', updateAnimation);
    reduced.addEventListener('change', updateAnimation);
    const fallback = () => {
      renderer.setAnimationLoop(null);
      renderer.domElement.style.display = 'none';
      host.classList.remove('is-ready');
    };
    renderer.domElement.addEventListener('webglcontextlost', fallback);
    resize();
    updateTheme();
    updateAnimation();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    document.addEventListener('pointerup', event => {
      if (reduced.matches || event.target.closest('a, button, input, textarea, select')) return;
      if (showcase && !host.contains(event.target)) return;
      const box = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - box.left) / box.width * 2 - 1, -((event.clientY - box.top) / box.height * 2 - 1));
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(logos.map(logo => logo.group), true)[0];
      if (!hit) return;
      let object = hit.object;
      while (object.parent && object.parent !== scene) object = object.parent;
      object.userData.pulse = 1;
      host.dataset.reaction = String(Number(host.dataset.reaction || 0) + 1);
    });
    new GLTFLoader().load(host.dataset.model, gltf => {
      const model = gltf.scene;
      model.rotation.x = Math.PI / 2;
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const scale = 2.5 / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      model.position.copy(center.multiplyScalar(-scale));
      anchors.forEach((anchor, index) => {
        const group = new THREE.Group();
        const clone = model.clone(true);
        clone.traverse(node => {
          if (!node.isMesh) return;
          const soften = original => {
            const material = original.clone();
            material.transparent = true;
            material.opacity = showcase ? 1 : index === 0 ? .25 : .14;
            material.userData.baseOpacity = material.opacity;
            material.depthWrite = false;
            return material;
          };
          node.material = Array.isArray(node.material) ? node.material.map(soften) : soften(node.material);
        });
        group.add(clone);
        group.scale.setScalar(anchor[2]);
        group.rotation.set(.15, -.3 + index * .12, index * .1);
        scene.add(group);
        logos.push({group, anchor});
      });
      host.classList.add('is-ready');
      resize();
    }, undefined, () => { host.classList.remove('is-ready'); });
  } catch {
    renderer?.dispose();
  }
}
