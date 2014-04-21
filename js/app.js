'use strict';

var App = {
	requestCount: 0,
	slideCount: 3,
	slideIndex: 0,
	current: 'about',
	last: 'about'
}

// Skip initial sequence
App.skip = function() {
	if (!this.inFade) {
		clearTimeout(this.slideTimeout);
		this.enter();
	}
};

// Enter main screen
App.enter = function() {
	var that = this;
	this.fade("slide" + this.slideIndex, false, function() {
		that.fade("main", true, null);
		document.getElementById("skip").style.display = "none";
		document.getElementById("nav-menu").style.display = "block";
	});
};

// Fade out 'from', fade in 'to'
App.transition = function(from, to) {
	if (from !== to  && !this.inFade) {
		var that = this;

		this.current = to;
		this.last = from;

		this.fade(from, false, function() {
			that.fade(to, true, null);
		});

		// Terminate game loop if necessary
		if (from === "game") {
			Platformer.forceGameOver();
		}
	}
};

// Helper for cross domain get requests
App.get = function(url, key, success, failure) {
	this.requestCount++;

	window["callback" + this.requestCount] = function(response) {
	  success(response.data || response);
	};

	var script = document.createElement('script');
	script.src = url + '?' + key + '=callback' + this.requestCount;

	document.getElementsByTagName('head')[0].appendChild(script);
};

App.openModal = function(id) {
	var body = document.getElementById("modal-body");

	var xmlhttp = new XMLHttpRequest();

	xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      body.innerHTML =  xmlhttp.responseText;
      App.fade('modal-background', true, null);
    }
  }

	xmlhttp.open("GET", "snippets/samples/" + id + ".html", true);
  xmlhttp.send();

};

App.closeModal = function() {
	App.fade('modal-background', false, null);
}

App.startGame = function() {
	var character = "lion", height = 62, width = 72;
  //var character = "rayman", height = 68, width = 38;

  Platformer.setupSprite(10, 338, height, width, {
      left: ["images/" + character + "/left1.png", "images/" + character + "/left2.png",
             "images/" + character + "/left3.png", "images/" + character + "/left4.png"],
      right: ["images/" + character + "/right1.png", "images/" + character + "/right2.png",
              "images/" + character + "/right3.png", "images/" + character + "/right4.png"],
      jump_left: "images/" + character + "/left1.png",
      jump_right: "images/" + character + "/right1.png"
  });
  
  Platformer.setupCanvas('game-canvas', 'collision-class');
  Platformer.start();
}

App.gameOver = function() {
	var button = document.getElementById("game-start");
	button.innerHTML = "Try Again";
	button.style.display = "block";
}