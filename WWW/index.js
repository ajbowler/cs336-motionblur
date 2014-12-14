/**
 * @author Andrew Bowler
 *
 * An experiment with motion blur of dynamic objects using Three.js
 */

var scene = new THREE.Scene();
var increment = 300;

////////////////////////////////////////
/////////  STEVE'S CAMERA CODE  ////////
////////////////////////////////////////

var axis = 'z';
var paused = false;
var camera;
var carDummy;

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
  var render = function()
  {
    requestAnimationFrame(render);

    carDummy.position.x -= increment;
    if(carDummy.position.x < -30000) {
      carDummy.position.set(20000, -8010, 640);
    }

    renderer.render(scene, camera);
  };

  render();
}

function getIncrement() {
  increment = document.getElementById('increment').value || 300;
}