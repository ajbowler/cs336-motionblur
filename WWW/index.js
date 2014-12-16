/* jslint sub: true */
/* jslint browser: true*/
/* global THREE */
/* global dat: true*/

var container;
var worldGeometry;
var camera, controls, scene, renderer;
var car;
var composer, pass, composer2, pass2;
var mesh;
var clock = new THREE.Clock();
var fov = 70;
var nfov = 70;

var mCurrent = new THREE.Matrix4();
var mPrev = new THREE.Matrix4();
var tmpArray = new THREE.Matrix4();
var prevCamPos = new THREE.Vector3();

var depthMaterial;
var meshMaterial = new THREE.MeshPhongMaterial({color: 0x806040, specular: 0xffffff, specularity: 10, shading: THREE.FlatShading});
var meshMaterial2 = new THREE.MeshBasicMaterial({color: 0xffffff, emissive: 0xffffff});

var imagePath = '../resources/images/';
var images = [
  imagePath + 'px.png',
  imagePath + 'nx.png',
  imagePath + 'py.png',
  imagePath + 'ny.png',
  imagePath + 'pz.png',
  imagePath + 'nz.png'
];

var planeImage = imagePath + 'roads.jpg';

/**
 * The parameters for dat gui.
 */
var Params = function() {
  this.blur = 1;
  this.fps = 60;
  this.carSpeed = 20;
};
var params = new Params();

init();
animate();

function init() {
  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 1, 9000);
  camera.position.set(-50, 1300, 2250);

  controls = new THREE.OrbitControls(camera);
  controls.damping = 0.2;
  controls.keyPanSpeed = 700;

  scene = new THREE.Scene();

  scene.add(new THREE.AmbientLight(0x505050));

  var light = new THREE.SpotLight(0xffffff, 1.5);
  light.position.set(0, 500, 2000);
  light.castShadow = true;

  light.shadowCameraNear = 200;
  light.shadowCameraFar = camera.far;
  light.shadowCameraFov = 50;

  light.shadowBias = -0.00022;
  light.shadowDarkness = 0.5;

  light.shadowMapWidth = 2048;
  light.shadowMapHeight = 2048;

  var light = new THREE.SpotLight(0xffffff, 1.5);
  light.position.set(500, -500, 2000);
  light.castShadow = true;

  light.shadowCameraNear = 200;
  light.shadowCameraFar = camera.far;
  light.shadowCameraFov = 50;

  light.shadowBias = -0.00022;
  light.shadowDarkness = 0.5;

  light.shadowMapWidth = 2048;
  light.shadowMapHeight = 2048;

  scene.add(light);
  

  /////////////////////////////////
  //////////// SKYBOX /////////////
  /////////////////////////////////
  
  var skyboxMap = THREE.ImageUtils.loadTextureCube(images);
  var skyboxShader = THREE.ShaderLib["cube"];
  skyboxShader.uniforms["tCube"].value = skyboxMap;
  var skyboxMaterial = new THREE.ShaderMaterial({
    fragmentShader : skyboxShader.fragmentShader,
    vertexShader : skyboxShader.vertexShader,
    uniforms : skyboxShader.uniforms,
    side : THREE.BackSide
  });

  var skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);

  var skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  skybox.scale.set(5, 5, 5);
  scene.add(skybox);

  var roadGeometry = new THREE.PlaneGeometry(6000, 6000);
  var roadMaterial = new THREE.MeshPhongMaterial({
    map: THREE.ImageUtils.loadTexture(planeImage)
  });

  var road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x -= 90 * Math.PI / 180;
  road.position.y -= 500;
  scene.add(road);

  worldGeometry = new THREE.Geometry();

  /////////////////////////////////
  //////////// OBJECT /////////////
  /////////////////////////////////

  var carGeometry = new THREE.BoxGeometry(1, 1, 1);

  var carMaterial = new THREE.MeshPhongMaterial({
    color : 0xcc0000,
    ambient : 0xff0000,
    specular : 0x050505,
    shininess : 50
  });

  car = new THREE.Mesh(carGeometry, carMaterial);
  car.position.set(1500, -260, 640);
  car.scale.set(160, 300, 800);

  car.rotation.y += 90 * Math.PI / 180;

  car.updateMatrixWorld();

  worldGeometry.merge(car.geometry, car.matrixWorld);

  /////////////////////////////////////
  /////////// DEPTH BUFFER ////////////
  /////////////////////////////////////

  depthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      mNear: {type: 'f', value: camera.near},
      mFar: {type: 'f', value: camera.far},
      opacity: {type: 'f', value: 1}
    },

    vertexShader: document.getElementById('vs-depthRender').textContent,
    fragmentShader: document.getElementById('fs-depthRender').textContent
  });

  // There are two meshes here to hold the matrices for the current and previous frames.
  mesh = new THREE.Mesh(worldGeometry, depthMaterial);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  scene.add(car);

  mesh2 = new THREE.Mesh(worldGeometry, depthMaterial);
  scene.add(mesh2);

  renderer = new THREE.WebGLRenderer({antialias: true});
  document.body.appendChild(renderer.domElement);
  renderer.sortObjects = false;
  renderer.setClearColor(0);
  renderer.shadowMapEnabled = true;
  renderer.shadowMapType = THREE.PCFShadowMap;

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));

  composer2 = new THREE.EffectComposer(renderer);
  composer2.addPass(new THREE.RenderPass(scene, camera));

  //////////////////////////////////////
  //////////// MOTION BLUR /////////////
  //////////////////////////////////////

  var motionBlurShader = {

    uniforms: {
      tDiffuse: {type: 't', value: null},
      tColor: {type: 't', value: null},
      resolution: {type: 'v2', value: new THREE.Vector2(1, 1)},
      viewProjectionInverseMatrix: {type: 'm4', value: new THREE.Matrix4()},
      previousViewProjectionMatrix: {type: 'm4', value: new THREE.Matrix4() },
      velocityFactor: {type: 'f', value: 1 }
    },

    vertexShader: document.getElementById('vs-motionBlur').textContent,
    fragmentShader: document.getElementById('fs-motionBlur').textContent
  }

  pass = new THREE.ShaderPass(motionBlurShader);
  pass.renderToScreen = true;
  composer.addPass(pass);

  container.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);
  onWindowResize();

  //////////////////////////////////
  //////////// DAT GUI /////////////
  //////////////////////////////////

  var gui = new dat.GUI();
  gui.add(params, 'blur', .1, 10);
  gui.add(params, 'fps', 1, 60);
  gui.add(params, 'carSpeed', 0, 100);
}

function onWindowResize() {
  var s = 1;
  composer.setSize(s * window.innerWidth, s * window.innerHeight);
  composer2.setSize(s * window.innerWidth, s * window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(s * window.innerWidth, s * window.innerHeight);
  pass.uniforms.resolution.value.set(s * window.innerWidth, s * window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

var lastTime = Date.now();
var projectionMatrixInverse = new THREE.Matrix4();

function render() {

  var t = Date.now();
  if(t - lastTime > (1000 / params.fps)) {

    pass.material.uniforms.velocityFactor.value = params.blur;

    scene.remove(mesh2);
    scene.remove(mesh);
    car.position.x -= params.carSpeed;
    if(car.position.x < -3000) {
      car.position.set(1500, -260, 640);
    }

    car.updateMatrix();
    car.updateMatrixWorld();

    camera.updateMatrix();
    camera.updateMatrixWorld();

    tmpArray.copy(camera.matrixWorldInverse);
    tmpArray.multiply(camera.projectionMatrix);
    mCurrent.getInverse(tmpArray);

    pass.material.uniforms.viewProjectionInverseMatrix.value.copy(mCurrent);
    pass.material.uniforms.previousViewProjectionMatrix.value.copy(mPrev);
    
    mesh.material = meshMaterial;
    mesh2.material = meshMaterial2;
    composer2.render();

    mesh.material = depthMaterial;
    mesh2.material = depthMaterial;
    pass.material.uniforms.tColor.value = composer2.renderTarget2;
    composer.render();

    mPrev.copy(tmpArray);

    prevCamPos.copy(camera.position);

    lastTime = t;
  }
}