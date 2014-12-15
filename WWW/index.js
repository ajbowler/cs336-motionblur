/**
 * @author Andrew Bowler
 *
 * An experiment with motion blur of dynamic objects using Three.js
 */

var axis = 'z';
var paused = false;
var camera;

var scene = new THREE.Scene();
var increment = 300;
var carDummy;
var composer;
var composer2;
var pass;
var pass2;

var clock = new THREE.Clock();

var currentMatrix = new THREE.Matrix4();
var previousMatrix = new THREE.Matrix4();
var tmpArray = new THREE.Matrix4();
var projectionMatrixInverse = new THREE.Matrix4();

var depthMaterial;

////////////////////////////////////////
/////////  STEVE'S CAMERA CODE  ////////
////////////////////////////////////////

// translate keypress events to strings
// from http://javascript.info/tutorial/keyboard-events
function getChar(event)
{
  if (event.which == null)
  {
    return String.fromCharCode(event.keyCode) // IE
  }
  else if (event.which != 0 && event.charCode != 0)
  {
    return String.fromCharCode(event.which) // the rest
  }
  else
  {
    return null; // special key
  }
}

function cameraControl(c, ch)
{
  var distance = c.position.length();
  var q, q2;

  switch (ch)
  {
  // camera controls
  case 'w':
    c.translateZ(-100);
    return true;
  case 'a':
    c.translateX(-100);
    return true;
  case 's':
    c.translateZ(100);
    return true;
  case 'd':
    c.translateX(100);
    return true;
  case 'r':
    c.translateY(100);
    return true;
  case 'f':
    c.translateY(-100);
    return true;
  case 'j':
    // need to do extrinsic rotation about world y axis, so multiply
    // camera's quaternion
    // on left
    q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),
        5 * Math.PI / 180);
    q2 = new THREE.Quaternion().copy(c.quaternion);
    c.quaternion.copy(q).multiply(q2);
    return true;
  case 'l':
    q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),
        -5 * Math.PI / 180);
    q2 = new THREE.Quaternion().copy(c.quaternion);
    c.quaternion.copy(q).multiply(q2);
    return true;
  case 'i':
    // intrinsic rotation about camera's x-axis
    c.rotateX(5 * Math.PI / 180);
    return true;
  case 'k':
    c.rotateX(-5 * Math.PI / 180);
    return true;
  case 'O':
    c.lookAt(new THREE.Vector3(0, 0, 0));
    return true;
  case 'S':
    c.fov = Math.min(80, c.fov + 5);
    c.updateProjectionMatrix();
    return true;
  case 'W':
    c.fov = Math.max(5, c.fov - 5);
    c.updateProjectionMatrix();
    return true;

    // alternates for arrow keys
  case 'J':
    // this.orbitLeft(5, distance)
    c.translateZ(-distance);
    q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),
        5 * Math.PI / 180);
    q2 = new THREE.Quaternion().copy(c.quaternion);
    c.quaternion.copy(q).multiply(q2);
    c.translateZ(distance)
    return true;
  case 'L':
    // this.orbitRight(5, distance)
    c.translateZ(-distance);
    q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),
        -5 * Math.PI / 180);
    q2 = new THREE.Quaternion().copy(c.quaternion);
    c.quaternion.copy(q).multiply(q2);
    c.translateZ(distance)
    return true;
  case 'I':
    // this.orbitUp(5, distance)
    c.translateZ(-distance);
    c.rotateX(-5 * Math.PI / 180);
    c.translateZ(distance)
    return true;
  case 'K':
    // this.orbitDown(5, distance)
    c.translateZ(-distance);
    c.rotateX(5 * Math.PI / 180);
    c.translateZ(distance)
    return true;
  }
  return false;
}

function handleKeyPress(event)
{
  var ch = getChar(event);
  if (cameraControl(camera, ch))
    return;
}

///////////////////////////////////
////////////  IMAGES  /////////////
///////////////////////////////////

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

function start() {
  window.onkeypress = handleKeyPress;

  var worldGeometry = new THREE.Geometry();

  var scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, 1.5, 0.1, 100000);
  camera.position.x = 19000;
  camera.position.y = 9800;
  camera.position.z = 1400;
  camera.lookAt(new THREE.Vector3(-1000, -6000, 0));
  var light = new THREE.AmbientLight( 0xB0B0B0 );
  scene.add( light );

  var ourCanvas = document.getElementById('theCanvas');
  var renderer = new THREE.WebGLRenderer(
  {
    canvas : ourCanvas
  });

  //////////////////////////////////
  ///////////  SHADERS  ////////////
  //////////////////////////////////

  depthMaterial = new THREE.ShaderMaterial({
    uniforms: {
      mNear: { type: 'f', value: camera.near },
      mFar: { type: 'f', value: camera.far },
      opacity: { type: 'f', value: 1 }
    },

    vertexShader: document.getElementById( 'vs-depthRender' ).textContent,
    fragmentShader: document.getElementById( 'fs-depthRender' ).textContent
  });

  //////////////////////////////////
  ////////////  SKYBOX  ////////////
  //////////////////////////////////

  var skyboxMap = THREE.ImageUtils.loadTextureCube(images);
  var skyboxShader = THREE.ShaderLib["cube"];
  skyboxShader.uniforms["tCube"].value = skyboxMap;
  var skyboxMaterial = new THREE.ShaderMaterial(
  {
    fragmentShader : skyboxShader.fragmentShader,
    vertexShader : skyboxShader.vertexShader,
    uniforms : skyboxShader.uniforms,
    side : THREE.BackSide
  });

  var skyboxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);

  var skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  skybox.scale.set(5, 5, 5);
  scene.add(skybox);

  var roadGeometry = new THREE.PlaneGeometry( 49500, 49500);
  var roadMaterial = new THREE.MeshPhongMaterial({
    map: THREE.ImageUtils.loadTexture(planeImage)
  });

  var road = new THREE.Mesh(roadGeometry, roadMaterial);
  road.rotation.x -= 90 * Math.PI / 180;
  road.position.y -= 10000;
  scene.add(road);

  ///////////////////////////////////
  ///////////  OBJECTS  /////////////
  ///////////////////////////////////

  // Create a car
  carDummy = new THREE.Object3D();

  var carGeometry = new THREE.BoxGeometry(1, 1, 1);
  var carMaterial = new THREE.MeshPhongMaterial({
    color : 0xcc0000,
    ambient : 0xff0000,
    specular : 0x050505,
    shininess : 50
  });

  var car = new THREE.Mesh(carGeometry, carMaterial);
  carDummy.add(car);
  carDummy.position.set(20000, -8010, 640);
  carDummy.scale.set(16000, 3000, 8000);

  carDummy.rotation.y += 90 * Math.PI / 180;

  scene.add(carDummy);

  var ourCanvas = document.getElementById('theCanvas');
  var renderer = new THREE.WebGLRenderer(
  {
    canvas : ourCanvas,
    antialias: true
  });

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));

  composer2 = new THREE.EffectComposer(renderer);
  composer2.addPass(new THREE.RenderPass(scene, camera));

  var motionBlurShader = {
    uniforms: {
      tDiffuse: { type: 't', value: null },
      tColor: { type: 't', value: null },
      resolution: { type: 'v2', value: new THREE.Vector2( 1, 1 ) },
      viewProjectionInverseMatrix: { type: 'm4', value: new THREE.Matrix4() },
      previousViewProjectionMatrix: { type: 'm4', value: new THREE.Matrix4() },
      velocityFactor: { type: 'f', value: 1 }
    },

    vertexShader: document.getElementById( 'vs-motionBlur' ).textContent,
    fragmentShader: document.getElementById( 'fs-motionBlur' ).textContent
  };

  pass = new THREE.ShaderPass(motionBlurShader);
  pass.renderToScreen = true;
  composer.addPass(pass);

  // var render = function()
  // {
  //   requestAnimationFrame(render);

  //   carDummy.position.x -= increment;
  //   if(carDummy.position.x < -30000) {
  //     carDummy.position.set(20000, -8010, 640);
  //   }

  //   renderer.render(scene, camera);
  // };

  var lastTime = Date.now();

  var render = function() {

    requestAnimationFrame(render);

    var ellapsedFactor = clock.getDelta();

    var t = Date.now();
    if( t - lastTime > ( 1000 ) ) {

      pass.material.uniforms.velocityFactor.value = 1;

      carDummy.position.x -= increment;
      if(carDummy.position.x < -30000) {
        carDummy.position.set(20000, -8010, 640);
      }

      camera.updateMatrix();
      camera.updateMatrixWorld();

      tmpArray.copy( camera.matrixWorldInverse );
      tmpArray.multiply( camera.projectionMatrix );
      currentMatrix.getInverse( tmpArray );

      pass.material.uniforms.viewProjectionInverseMatrix.value.copy( currentMatrix );
      pass.material.uniforms.previousViewProjectionMatrix.value.copy( previousMatrix ); 

      composer2.render();

      pass.material.uniforms.tColor.value = composer2.renderTarget2;
      composer.render();

      previousMatrix.copy( tmpArray );

      lastTime = t;

    }
  }
  render();
}

function getIncrement() {
  increment = document.getElementById('increment').value || 300;
}