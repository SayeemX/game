import * as THREE from 'three';

class Arrow {
    constructor(position, direction, charge = 1) {
        this.charge = charge; // 0-1 value for draw strength
        
        // Create arrow group
        this.mesh = new THREE.Group();
        
        // Arrow shaft
        this.createShaft();
        
        // Arrowhead
        this.createArrowhead();
        
        // Fletching (feathers)
        this.createFletching();
        
        // Trail effect
        this.createTrail();
        
        // Set initial position and rotation
        this.mesh.position.copy(position);
        
        // Point towards direction
        const target = new THREE.Vector3().addVectors(position, direction);
        this.mesh.lookAt(target);
        
        // Physics properties
        this.velocity = new THREE.Vector3();
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        this.isActive = true;
        this.trailPoints = [];
        this.maxTrailPoints = 20;
        
        // Audio
        this.isWhistling = false;
    }
    
    createShaft() {
        const shaftLength = 0.8;
        const shaftRadius = 0.005;
        
        const shaftGeometry = new THREE.CylinderGeometry(
            shaftRadius, 
            shaftRadius * 0.9, 
            shaftLength, 
            8
        );
        
        shaftGeometry.rotateX(Math.PI / 2);
        
        const shaftMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513, 
            roughness: 0.8,
            metalness: 0.1
        });
        
        this.shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        this.shaft.position.z = shaftLength / 2;
        this.mesh.add(this.shaft);
    }
    
    createArrowhead() {
        const headHeight = 0.1;
        const headRadius = 0.015;
        
        const headGeometry = new THREE.ConeGeometry(headRadius, headHeight, 8);
        headGeometry.rotateX(Math.PI / 2);
        
        const shaftLength = 0.8;
        headGeometry.translate(0, 0, shaftLength + headHeight / 2);
        
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0, 
            roughness: 0.3,
            metalness: 0.8
        });
        
        this.arrowhead = new THREE.Mesh(headGeometry, headMaterial);
        this.mesh.add(this.arrowhead);
    }
    
    createFletching() {
        const shaftLength = 0.8;
        const featherColors = [0xFF0000, 0xFFFFFF, 0x0000FF]; 
        
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const featherGeometry = new THREE.PlaneGeometry(0.08, 0.03);
            
            featherGeometry.rotateY(Math.PI / 2);
            featherGeometry.rotateZ(angle);
            featherGeometry.translate(0, 0, 0.05);
            
            const featherMaterial = new THREE.MeshStandardMaterial({
                color: featherColors[i],
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                roughness: 0.9
            });
            
            const feather = new THREE.Mesh(featherGeometry, featherMaterial);
            this.mesh.add(feather);
        }
    }
    
    createTrail() {
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xFFA500,
            transparent: true,
            opacity: 0.6
        });
        
        this.trail = new THREE.Line(trailGeometry, trailMaterial);
        // Add trail to scene, not to mesh group, so it stays in world space
        this.trail.frustumCulled = false;
    }
    
    updateTrail() {
        if (!this.isActive) return;
        
        this.trailPoints.push(this.mesh.position.clone());
        if (this.trailPoints.length > this.maxTrailPoints) {
            this.trailPoints.shift();
        }
        
        if (this.trailPoints.length < 2) return;

        const positions = new Float32Array(this.trailPoints.length * 3);
        this.trailPoints.forEach((point, i) => {
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        });
        
        this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trail.geometry.attributes.position.needsUpdate = true;
    }
    
    shoot(force, direction) {
        const baseSpeed = 60; 
        const speed = baseSpeed * force;
        this.velocity.copy(direction).multiplyScalar(speed);
        this.isActive = true;
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // Gravity
        this.velocity.addScaledVector(this.gravity, deltaTime);
        
        // Position
        this.mesh.position.addScaledVector(this.velocity, deltaTime);
        
        // Rotation
        if (this.velocity.lengthSq() > 0.1) {
            const direction = this.velocity.clone().normalize();
            const target = new THREE.Vector3().addVectors(this.mesh.position, direction);
            this.mesh.lookAt(target);
            this.mesh.rotateZ(10 * deltaTime);
        }
        
        this.updateTrail();
        
        if (this.mesh.position.y < -5 || this.mesh.position.length() > 500) {
            this.isActive = false;
        }
    }
}

export default Arrow;
