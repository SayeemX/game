import * as THREE from 'three';

class Arrow {
    constructor(position, direction, charge = 1) {
        this.charge = charge;
        this.mesh = new THREE.Group();
        
        this.createShaft();
        this.createArrowhead();
        this.createFletching();
        
        // Setup visual trail (Ribbon style)
        this.createTrail();
        
        this.mesh.position.copy(position);
        this.isActive = true;
        this.trailPoints = [];
        this.maxTrailPoints = 20;
        this.body = null; 
    }

    createShaft() {
        const shaftLength = 0.8;
        const shaftRadius = 0.006;
        const geometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 8);
        geometry.rotateX(Math.PI / 2);
        const material = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.9 });
        const shaft = new THREE.Mesh(geometry, material);
        shaft.position.z = -shaftLength / 2;
        this.mesh.add(shaft);
    }

    createArrowhead() {
        const headLength = 0.12;
        const headRadius = 0.018;
        const geometry = new THREE.ConeGeometry(headRadius, headLength, 8);
        geometry.rotateX(Math.PI / 2);
        const material = new THREE.MeshStandardMaterial({ color: 0x90a4ae, metalness: 0.8, roughness: 0.2 });
        const head = new THREE.Mesh(geometry, material);
        head.position.z = 0.06; // Tip is forward
        this.mesh.add(head);
    }

    createFletching() {
        const featherColor = 0xffffff;
        const mat = new THREE.MeshStandardMaterial({ color: featherColor, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
        
        for (let i = 0; i < 3; i++) {
            const feather = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.04), mat);
            feather.rotateZ((i * Math.PI * 2) / 3);
            feather.position.z = -0.7;
            feather.position.y = 0.015;
            this.mesh.add(feather);
        }
    }

    createTrail() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({ 
            color: 0xffffff, 
            transparent: true, 
            opacity: 0.4,
            linewidth: 2
        });
        this.trail = new THREE.Line(geometry, material);
        this.trail.frustumCulled = false;
    }

    update(deltaTime) {
        if (!this.isActive || !this.body) return;

        // Sync with Physics
        this.mesh.position.copy(this.body.position);

        // Orient arrow along velocity vector
        const vel = this.body.velocity;
        if (vel.lengthSquared() > 0.5) {
            const direction = new THREE.Vector3(vel.x, vel.y, vel.z).normalize();
            // Arrow points along +Z in local space
            this.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
        }

        this.updateTrail();
    }

    updateTrail() {
        this.trailPoints.push(this.mesh.position.clone());
        if (this.trailPoints.length > this.maxTrailPoints) this.trailPoints.shift();
        
        if (this.trailPoints.length < 2) return;

        const positions = new Float32Array(this.trailPoints.length * 3);
        this.trailPoints.forEach((p, i) => {
            positions[i * 3] = p.x;
            positions[i * 3 + 1] = p.y;
            positions[i * 3 + 2] = p.z;
        });
        this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        this.trail.geometry.attributes.position.needsUpdate = true;
    }
}

export default Arrow;
