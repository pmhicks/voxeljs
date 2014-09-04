
//pollutes global name space with vjs_


vjs_width = 0;
vjs_height = 0;
vjs_height_minus1 = 0;

vjs_heightmap = null;    //heights 0-255
vjs_texturemap = null;   //texture in rgb

vjs_fogRed = 200;
vjs_fogGreen = 215;
vjs_fogBlue = 230;

vjs_K_center = 100; //default


//set by hotkeys
vjs_dir_forward = false;
vjs_dir_backward = false;
vjs_turn_left = false;
vjs_turn_right = false;
vjs_dir_up = false;
vjs_dir_down = false;
vjs_do_fog = true;
vjs_do_help = true;


//factor must be 0-256
function vjs_blendColor(c1, c2, factor) {
    return ((((c1&0xFF) * (256-factor) + (c2&0xFF) * factor) & 0xFF00) >>>8);
}


function vjs_init() {
    var canvas=document.getElementById("canvas1");
    vjs_width = canvas.width;
    vjs_height = canvas.height;
    vjs_height_minus1 = vjs_height - 1;
    vjs_K_center = Math.floor(vjs_height * .7);
    
    vjs_ctx=canvas.getContext('2d');
    vjs_imageData = vjs_ctx.getImageData(0,0,canvas.width,canvas.height);
    
    vjs_distance = ((vjs_width / 2) / Math.tan(45 * Math.PI / 180)); //fixed 90 degress FOV
    
    vjs_init_keys();
    vjs_resetPosition();
    vjs_loadMaps();
    
}

function vjs_resetPosition() {
    vjs_playerX = 512;
    vjs_playerY = 512;
    vjs_cameraH = 300;
    vjs_setDirection(90);
}

function vjs_drawText(text) {    
    vjs_ctx.save();
    vjs_ctx.clearRect(0, 0, vjs_width, vjs_height);
    vjs_ctx.font = "30px Arial";
    vjs_ctx.fillText(text, 10, 50);
    vjs_ctx.restore();
}

function vjs_drawHelp() {
    vjs_ctx.save();
    vjs_ctx.fillStyle = 'yellow';
    vjs_ctx.font = '15px Arial';
    vjs_ctx.fillText('w - forward', 10, 20);
    vjs_ctx.fillText('s - backward', 10, 40);
    vjs_ctx.fillText('a - turn left', 10, 60);
    vjs_ctx.fillText('d - turn right', 10, 80);
    vjs_ctx.fillText('q - move up', 10, 100);
    vjs_ctx.fillText('e - move down', 10, 120);
    
    vjs_ctx.fillText('r - reset to initial position', 10, 160);
    vjs_ctx.fillText('f - toggle fog', 10, 180);
    vjs_ctx.fillText('h - toggle help', 10, 200);
    vjs_ctx.restore();
    
}

function vjs_init_keys() {
    $(document).bind('keydown', 'w', function() { vjs_dir_forward = true; });
    $(document).bind('keyup'  , 'w', function() { vjs_dir_forward = false; });
    
    $(document).bind('keydown', 's', function() { vjs_dir_backward = true; });
    $(document).bind('keyup'  , 's', function() { vjs_dir_backward = false; });
    
    $(document).bind('keydown', 'a', function() { vjs_turn_left = true; });
    $(document).bind('keyup'  , 'a', function() { vjs_turn_left = false; });
    
    $(document).bind('keydown', 'd', function() { vjs_turn_right = true; });
    $(document).bind('keyup'  , 'd', function() { vjs_turn_right = false; });
    
    $(document).bind('keydown', 'q', function() { vjs_dir_up = true; });
    $(document).bind('keyup'  , 'q', function() { vjs_dir_up = false; });
    
    $(document).bind('keydown', 'e', function() { vjs_dir_down = true; });
    $(document).bind('keyup'  , 'e', function() { vjs_dir_down = false; });
    
    $(document).bind('keyup'  , 'f', function() { vjs_do_fog = !vjs_do_fog; });
    $(document).bind('keyup'  , 'h', function() { vjs_do_help = !vjs_do_help; });
    
    $(document).bind('keyup'  , 'r', vjs_resetPosition);
    vjs_resetPosition
}

function vjs_updatePosition() {
    if(vjs_dir_forward) {
        vjs_playerX -= 2 * vjs_dirSin;
        vjs_playerY += 2 * vjs_dirCos;
    }
    if(vjs_dir_backward) {
        vjs_playerX += 2 * vjs_dirSin;
        vjs_playerY -= 2 * vjs_dirCos;
    }
    if(vjs_turn_left) {
        vjs_setDirection(vjs_direction + 5);
    }
    if(vjs_turn_right) {
        vjs_setDirection(vjs_direction - 5);
    }
    if(vjs_dir_up) {
        vjs_cameraH += 4;
    }
    if(vjs_dir_down) {
        vjs_cameraH -= 4;
    }
}

function vjs_setText(id, text) {
    var elm=document.getElementById(id);
    if (elm) {
        elm.innerHTML = text;
    }
}

function vjs_showInfo() {
    vjs_setText('vjs_x', Math.floor(vjs_playerX));
    vjs_setText('vjs_y', Math.floor(vjs_playerY));
    vjs_setText('vjs_h', vjs_cameraH);
    vjs_setText('vjs_dir', vjs_direction);
}

vjs_attempts = 0;
function vjs_start() {
    if (vjs_attempts === 0) {
        vjs_drawText('Starting...');
    }
    
    //keep trying for 10s before giving up
    if (vjs_attempts < 20) {
        if (vjs_heightmap != null && vjs_texturemap != null) {
            
            //start the engine
            vjs_gameLoop();
            
        } else {
            vjs_attempts++;
            setTimeout(vjs_start, 500);
        }
    } else {
        vjs_drawText('Timed out loading maps. Try reloading page...');
    }
}

function vjs_gameLoop() {
    var start = window.performance.now();
    
    vjs_updatePosition();
    vjs_showInfo();
    vjs_render();
    var stop = window.performance.now();
    vjs_setText('vjs_time', Math.floor(stop-start));
    window.requestAnimationFrame(vjs_gameLoop);
}

function vjs_loadMaps() {
   
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'map/height.raw', true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
        vjs_heightmap = new Uint8Array(this.response);
    };
    xhr.send();
    
    var xhr2 = new XMLHttpRequest();
    xhr2.open('GET', 'map/texture.raw', true);
    xhr2.responseType = 'arraybuffer';

    xhr2.onload = function(e) {
        vjs_texturemap = new Uint8Array(this.response);
    };
    xhr2.send();
}

function vjs_setDirection(degrees) {
    vjs_direction = degrees;
    var rads = degrees * Math.PI / 180
    vjs_dirSin = Math.sin(rads);
    vjs_dirCos = Math.cos(rads);
}


function vjs_render() {
    var i;
    var pixels = vjs_imageData.data;
    var len = pixels.length;
    
    //clear
    for (i=0; i < len; i += 4) {
        pixels[i] = vjs_fogRed;
        pixels[i+1] = vjs_fogGreen;
        pixels[i+2] = vjs_fogBlue;
        pixels[i+3] = 255; 
        
    }
      
    var vpX, vpY, rotx, roty, width; 
    width = vjs_width;
    vpY = vjs_distance;
    for (i = 0; i < width; i++) {
        vpX = (i - width / 2) + .5;
            
        rotx = vpX * vjs_dirCos - vpY * vjs_dirSin;
        roty = vpX * vjs_dirSin + vpY * vjs_dirCos;
            
        vjs_drawline(pixels, i, vjs_playerX, vjs_playerY, rotx + vjs_playerX, roty + vjs_playerY);
    }
    
    vjs_ctx.putImageData(vjs_imageData, 0, 0);
    if (vjs_do_help) {
        vjs_drawHelp();
    }
}

function vjs_drawline(pixels, line, posX, posY, endX, endY) {
    var i,k, mag , stepX, stepY, stepZ;
    
    stepX = endX - posX;
    stepY = endY - posY;
    mag = Math.sqrt(stepX * stepX + stepY * stepY);
    
    //calc steps (normalize the ray)
    stepX = stepX / mag;
    stepY = stepY / mag;
    stepZ = vjs_distance / mag;
    
    
    var top_y,bottom_y = 0;
    var distZ = 0.0;
    var map_offset, im_offset;
    
    
    var cR, cG, cB;
    var fogFactor = 0;
    
    //sample (vjs_distance *4 ) times
    var sample_count = Math.floor(vjs_distance * 4);
    for (i = 0; i < sample_count && fogFactor < 256; i++) {
        //inc by step size
        posX += stepX;
        posY += stepY;
        distZ += stepZ;
        
        //get map offset for height + color 
        map_offset = (Math.floor(posY) & 1023) * 1024 + (Math.floor(posX) & 1023);
           
        //perspective calc
        top_y = (vjs_heightmap[map_offset] - vjs_cameraH) * 100 / distZ + vjs_K_center;
    
        //if above top height, then only to top
        if(top_y >= vjs_height) {
                top_y = vjs_height - 1;
        }
            
        //get color    
        map_offset *= 3; //adjust for 3 values (rgb)
        cR = vjs_texturemap[map_offset];
        cG = vjs_texturemap[map_offset+1];
        cB = vjs_texturemap[map_offset+2];
        
        //add fog
        if(vjs_do_fog && distZ > vjs_distance) {
            fogFactor = Math.floor( (distZ - vjs_distance) * .2); //arbitrary value that looked good
            if(fogFactor > 256) {
                fogFactor = 256;
            }
            cR = vjs_blendColor(cR, vjs_fogRed, fogFactor);
            cG = vjs_blendColor(cG, vjs_fogGreen, fogFactor);
            cB = vjs_blendColor(cB, vjs_fogBlue, fogFactor);    
        }
        
        //setPixels    
        for (k = bottom_y; k < top_y; k++) {
            im_offset = (line + (vjs_height_minus1 - k) * vjs_width) * 4;
            pixels[im_offset]   = cR    //red
            pixels[im_offset+1] = cG;   //green
            pixels[im_offset+2] = cB;   //blue
            pixels[im_offset+3] = 255;  //alpha
        }
        
        //keep track of last pixel
        if(top_y > bottom_y) {
            bottom_y = Math.floor(top_y);
        }
        
    }
}

