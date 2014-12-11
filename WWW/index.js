/**
 * @author Andrew Bowler
 *
 * An experiment with motion blur of dynamic objects using Three.js
 */

var scene = new THREE.Scene();

////////////////////////////////////////
/////////  STEVE'S CAMERA CODE  ////////
////////////////////////////////////////

var axis = 'z';
var paused = false;
var camera;

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
    c.translateY(100);
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
  imagePath + 'skybox_front.jpg',
  imagePath + 'skybox_back.jpg',
  imagePath + 'skybox_top.jpg',
  imagePath + 'roads.jpg',
  imagePath + 'skybox_right.jpg',
  imagePath + 'skybox_left.jpg'
];

///////////////////////////////////
////////////  SKYBOX  /////////////
///////////////////////////////////

var skyboxMap = THREE.ImageUtils.loadTextureCube(images);
var skyboxShader = THREE.ShaderLib['cube'];
var skyboxMaterial = new THREE.ShaderMaterial({
  fragmentShader : skyboxShader.fragmentShader,
  vertexShader : skyboxShader.vertexShader,
  uniforms : skyboxShader.uniforms,
  side : THREE.DoubleSide
});

var skyboxGeometry = new THREE.BoxGeometry(20000, 20000, 20000);

var skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
scene.add(skybox);

function start() {
  window.onKeyPress = handleKeyPress;

  var htmlCanvas = document.getElementById('theCanvas');
  var render = new THREE.WebGLRenderer({
    canvas : htmlCanvas
  });
  
  camera = new THREE.PerspectiveCamera(45, 1.5, 0.1, 500000);
  
}