import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export function Visor3DPage() {
  const mountRef = useRef(null);
  const navigate = useNavigate(); 

  useEffect(() => {
    if (!mountRef.current) return;

    //DIMENSIONES A PANTALLA COMPLETA
    const width = window.innerWidth;
    const height = window.innerHeight;

    //ESCENA Y RENDERER
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); 

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mountRef.current.appendChild(renderer.domElement);

    //CÁMARA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000000);

    //LUCES
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(1000, 1000, 1000);
    scene.add(dirLight);

    //CONTROLES
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;

    //MANEJO DE REDIMENSIONAMIENTO DE VENTANA
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    //CARGA DEL MODELO 3D
    const loader = new GLTFLoader();
    
    loader.load(
      `/Prueba.glb`, 
      (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.material.side = THREE.DoubleSide;
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.sub(center);
        scene.add(model);

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        camera.position.set(0, maxDim * 0.8, maxDim * 1.5);
        camera.lookAt(0, 0, 0);

        controls.target.set(0, 0, 0);
        controls.update();

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            renderer.render(scene, camera);
          });
        });
      },
      undefined,
      (error) => console.error("Error al cargar el modelo:", error)
    );

    //BUCLE DE ANIMACIÓN
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update(); 
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose(); 
    };
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      zIndex: 9999, 
      overflow: 'hidden', 
      backgroundColor: '#1a1a1a',
      margin: 0,
      padding: 0
    }}>
      
      <button 
        onClick={() => navigate('/login')} 
        style={{
          position: 'absolute',
          top: '20px', 
          left: '20px', 
          zIndex: 10000, 
          padding: '10px 20px',
          backgroundColor: 'rgba(0, 0, 0, 0.6)', 
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          backdropFilter: 'blur(5px)', 
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Volver
      </button>

      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}