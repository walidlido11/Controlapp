import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const ThreeDComponent = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // إعداد المشهد والكاميرا والمصابيح
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();

    // تعيين حجم اللوحة
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // إعداد الأشكال الهندسية
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // وضع الكاميرا في موقع مناسب
    camera.position.z = 5;

    // وظيفة الرسوم المتحركة
    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    animate();

    // التنظيف عند تفكيك المكون
    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100vh' }}></div>
  );
};

export default ThreeDComponent;
