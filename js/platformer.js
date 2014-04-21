var Platformer = (function() {
	var JUMPING_HEIGHT = -4.2, START_FALL = 0,
		LEFT = 37, RIGHT = 39, UP = 38,
		MOVING_DISTANCE = 240, COUNT = 0,
		WALK_INDEX = 0, WALK_INDEX_MAX;

	var sprite = {}, keysDown = {}, interval,
		gamePieces, movingBlocks, hiddenBlocks = [], 
		border = {}, canvas, ctx, coinsLeft = 5;

	var gravity = 0.1, velY = 0, 
		speed = 2, blockSpeed = 1;

	var Sprite = function(startX, startY, height, width, images) {
		this.height = height;
		this.width = width;
		this.x = startX;
		this.y = startY;
		this.movingRight = true;
		this.jumping = false;
		this.images_left = [];
		this.images_right = [];

		for (var i = 0; i < images.left.length; i++) {
			var image = new Image();
			image.src = images.left[i];
			this.images_left.push(image);
		}

		for (var i = 0; i < images.right.length; i++) {
			var image = new Image();
			image.src = images.right[i];
			this.images_right.push(image);
		}
		WALK_INDEX_MAX = images.right.length - 1;

  	this.image_jump_left = new Image();
  	this.image_jump_left.src = images.jump_left;

  	this.image_jump_right = new Image();
  	this.image_jump_right.src = images.jump_right;
	}

	var setupCanvas = function(canvasId, collisionClass) {
		canvas = document.getElementById(canvasId);
		ctx = canvas.getContext('2d');

		// Register game pieces
		gamePieces = [], movingBlocks = [];
		elements = document.getElementsByClassName(collisionClass);

		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			element.style.display = "block";

			// Register game pieces
			gamePieces.push({
				id: element.id,
				moves: element.hasAttribute('move'),
				isCoin: element.hasAttribute('coin'),
				left: element.offsetLeft - canvas.offsetLeft - sprite.width,
				top: element.offsetTop - canvas.offsetTop - sprite.height,
				right: element.offsetLeft - canvas.offsetLeft + element.offsetWidth,
				bottom: element.offsetTop - canvas.offsetTop + element.offsetHeight
			});

			// Register moving elements
			if (element.hasAttribute('move')) {
				movingBlocks.push({
					id: element.id,
					delta: 0,
					right: true,
					init_pos: element.offsetLeft,
					index: gamePieces.length - 1
				});
			}
		}

		// Add Bottom, less complicated for jumping/ledges
		gamePieces.push({
			left: 0,
			top: canvas.height - sprite.height,
			right: canvas.width - sprite.width,
			bottom: canvas.height - sprite.height + 10
		});

		// Add left and right borders
		border = {
			left: 0,
			right: canvas.width - sprite.width
		}

		// Add secret paths
		elements = document.getElementsByClassName("secret");
		for (var i = 0; i < elements.length; i++) {
			hiddenBlocks.push({
				left: element.offsetLeft - canvas.offsetLeft - sprite.width,
				top: element.offsetTop - canvas.offsetTop - sprite.height,
				right: element.offsetLeft - canvas.offsetLeft + element.offsetWidth,
				bottom: element.offsetTop - canvas.offsetTop + element.offsetHeight,
				element: elements[i]
			});
		}

	};

	var isInside = function(block) {
		if (sprite.x > block.left &&
			  sprite.x < block.right &&
			  sprite.y >= block.top - 100 &&
			  sprite.y <= block.bottom) {
			return true;
		}
		return false;
	} 

	var standingOn = function(gamePiece) {
		if (sprite.x >= gamePiece.left &&
			sprite.x <= gamePiece.right &&
			sprite.y === gamePiece.top) {
			return true;
		}
		else return false;
	};

	var collisionWith = function(element, x, y, i) {
		if (x > element.left && x < element.right &&
			y > element.top && y < element.bottom) {
			if (element.isCoin) {
				document.getElementById(element.id).style.display = "none";
				gamePieces.splice(i, 1);
				coinsLeft--;
				return false
			}
			else {
				return true;
			}
		}
		return false;
	};

	var handleMovingPieces = function() {
		for (var i = 0; i < movingBlocks.length; i++) {
			var block = movingBlocks[i];
			var element = document.getElementById(block.id);

			// Change Direction
			if (block.delta === MOVING_DISTANCE) {
				block.right = !block.right;
				block.delta = 0;
			} else {
				var gamePiece = gamePieces[block.index];

				// Update element position
				if (block.right) {
					element.style.left = element.offsetLeft + blockSpeed + "px";
				} else {
					element.style.left = element.offsetLeft - blockSpeed + "px";
				}

				// Update gamepiece positions
				gamePiece.left = element.offsetLeft - canvas.offsetLeft - sprite.width;
				gamePiece.right = element.offsetLeft - canvas.offsetLeft + element.offsetWidth;
				block.delta += 1;

				// Update sprite
				if (standingOn(gamePiece) || collisionWith(gamePiece, sprite.x, sprite.y, i)) {
					// If you get pushed into someone, block.right = !block.right
					if (block.right) {
						sprite.x += blockSpeed;
					} else {
						sprite.x -= blockSpeed;
					}
				}
			}
		}
	}

	var handleJump = function() {
		if (sprite.jumping) {
			velY += gravity;

			var tempY = sprite.y + velY;

			// Check for collisions
			for (var i = 0; i < gamePieces.length; i++) {
				var gamePiece = gamePieces[i];

				if (collisionWith(gamePiece, sprite.x, tempY, i)) {
					// Falling or rising?
					if (velY >= 0) {
					 	// Land on object
						sprite.y = gamePiece.top;
						sprite.jumping = false;
					} else {
						// Hit head on gamePiece
						velY = START_FALL;
					}
					return;
				}
			}
			sprite.y = tempY;
		}
	};

	var handleKeydown = function() {
		// Jump
		if (keysDown[UP]) {
			if(!sprite.jumping) {
       			sprite.jumping = true;
	       		velY = JUMPING_HEIGHT;
	      	}
		}
		// Move Left or Right
		if (keysDown[LEFT] || keysDown[RIGHT]) {

			var tempX = sprite.x;

			if (keysDown[LEFT]) {
				sprite.movingRight = false;
				tempX -= speed;
			} else {
				sprite.movingRight = true;
				tempX += speed;
			}

			// Check for collisions and ledges
			for (var i = 0; i < gamePieces.length; i++) {
				var gamePiece = gamePieces[i];

				// Stepped off ledge
				if (tempX > gamePiece.left && tempX < gamePiece.right &&
				    sprite.y < gamePiece.top && sprite.jumping == false) {
					/*** Make more robust ***/
					sprite.jumping = true;
					velY = START_FALL;
				}

				// Collision
				if (collisionWith(gamePiece, tempX, sprite.y, i)) {
					return;
				}
			}

			// Keep within bounds
			if (tempX > border.left && tempX < border.right) {
				sprite.x = tempX;

				if (++COUNT % 20 === 0) { // Switch walking image
					WALK_INDEX = (WALK_INDEX === WALK_INDEX_MAX) ? 0 : ++WALK_INDEX;
				}

			}
		}
	};

	var handleHiddenPaths = function() {
		// Check for secret passages
		for (var i = 0; i < hiddenBlocks.length; i++) {
			var block = hiddenBlocks[i];
			if (isInside(block)) {
				block.element.style.opacity = ".5";
			} else {
				block.element.style.opacity = "1";
			}
		}
	}

	var handleGameOver = function() {
		var e = document.createEvent( "HTMLEvents" );
	  e.initEvent( "gameOver", true, true );
	  window.dispatchEvent(e); // Tell Angular controller
	  clearInterval(interval); // Stop main

	  // Reset all moving blocks to initial position
	  for (var i = 0; i < movingBlocks.length; i++) {
			var block = movingBlocks[i];
			var element = document.getElementById(block.id);
			element.style.left = block.init_pos + "px";
		}

	}

	// The main game loop
	var main = function () {
		// Reset canvas
		canvas.width = canvas.width;	

		handleKeydown();
		handleJump();
		handleMovingPieces();
		handleHiddenPaths();

		if (coinsLeft === 0) {
			handleGameOver();
		}

		if (sprite.movingRight) {
			if (sprite.jumping) {
				ctx.drawImage(sprite.image_jump_right, sprite.x, sprite.y);
			} else {
				ctx.drawImage(sprite.images_right[WALK_INDEX], sprite.x, sprite.y);
			}
		} else {
			if (sprite.jumping) {
				ctx.drawImage(sprite.image_jump_left, sprite.x, sprite.y);
			} else {
				ctx.drawImage(sprite.images_left[WALK_INDEX], sprite.x, sprite.y);
			}
		}

		// Display coins left
		ctx.font = "24px Helvetica";
		ctx.textAlign = "left";
		ctx.textBaseline = "top";
		ctx.fillText("Coins left: " + coinsLeft, 0, 0);

	};
	
	return {
		setupSprite: function(startX, startY, height, width, images) { 
			sprite = new Sprite(startX, startY, height, width, images);
		},
		setupCanvas: function(canvasId, collisionClass) { 
			setGamePos();
			if (sprite) {
				setupCanvas(canvasId, collisionClass);
			} else {
				console.log("Must register Sprite before Canvas.");
			}
		},
		start: function() {

			addEventListener("keydown", function (e) {
				if ([LEFT,RIGHT,UP].indexOf(e.keyCode) != -1) e.preventDefault();
				keysDown[e.keyCode] = true;
			}, false);

			addEventListener("keyup", function (e) {
				delete keysDown[e.keyCode];
			}, false);

			if (canvas && sprite) {
				interval = setInterval(main, 1);
			} else {
				console.log("Must register both Sprite and Canvas with Platformer.");
			}
			coinsLeft = 5;
		},
		forceGameOver: function() {
			handleGameOver();
		}
	};

})();

/* 
	Set up gaming environment.
	Platformer requires absolute positions, so this is a responsive
	design segment for the game canvas
*/
var setGamePos = function() {

	document.getElementById("game-header").style.display = "block";
	document.getElementById("game").style.display = "block";

	var container = document.getElementById("game");

	var WIDTH = 1170,
			TOP = container.offsetTop + 75,
		  LEFT = (window.innerWidth - WIDTH) / 2;

  var canvas = document.getElementById("game-canvas");
  canvas.height = 400;
  canvas.width = WIDTH;
  canvas.style.top = TOP; /* game-start.top + 50 */
  canvas.style.left = LEFT;
  canvas.style.display = "block";

  // Clouds
  var clouds = document.getElementsByClassName("game-block");
  for (var i = 0; i < clouds.length; i++) {
    clouds[i].style.left = LEFT + 100 + (i * 140) + "px";
    clouds[i].style.top = TOP + 352 - (i * 75) + "px";
  }

  var cliff = document.getElementById("game-cliff"),
  	  cliffTop = document.getElementById("game-cliff-top"),
  	  cliffBottom = document.getElementById("game-cliff-bottom");

  cliff.style.left = LEFT + 850 + "px";
  cliff.style.top = TOP + 100 + "px";
  cliff.style.display = "block";

  cliffTop.style.left = LEFT + 850 + "px";
  cliffTop.style.top = TOP + 100;
  cliffTop.style.display = "block";

  cliffBottom.style.left = LEFT + 850 + "px";
  cliffBottom.style.top = TOP + 305;
  cliffBottom.style.display = "block";

  var coin1 = document.getElementById("coin1"),
      coin2 = document.getElementById("coin2"),
      coin3 = document.getElementById("coin3"),
      coin4 = document.getElementById("coin4"),
      coin5 = document.getElementById("coin5");

  coin1.style.top = TOP + 320 + "px";
  coin1.style.left = LEFT + 120 + "px";

  coin2.style.top = TOP + 170 + "px";
  coin2.style.left = LEFT + 398 + "px";

  coin3.style.top = TOP + 60 + "px";
  coin3.style.left = LEFT + 1100 + "px";

  coin4.style.top = TOP + 360 + "px";
  coin4.style.left = LEFT + 750 + "px";

  coin5.style.top = TOP + 260 + "px";
  coin5.style.left = LEFT + 1100 + "px";

  var button = document.getElementById("game-start");
  button.style.display = "none";

};

(function() {
	var button = document.getElementById("game-start");
	button.style.marginLeft = (window.innerWidth - 1180) / 2 - 5 + "px";

	if (window.innerWidth < 1200) {
		button.style.display = "none";
		document.getElementById("game-header").style.display = "none";
	}
})();