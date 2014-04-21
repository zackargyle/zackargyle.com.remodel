App.fade = function(id, fade_in, callback) {
	if (this.inFade) return;

	var element   = document.getElementById(id),
			min 		  = .02, max = .98,
		  opacity   = fade_in ? min : max,
      step_size = 0.1, step_len  = 3,
      that = this;

  // Make it visible for fade_in/fade_out
  element.style.display = "block";
	// Update element opacity every step_len
	that.inFade = true;
	var fadeTimer = setInterval(function () {

		// Update opacity
    var val = opacity * step_size;
	  opacity = fade_in ? opacity + val : opacity - val;
	  element.style.opacity = opacity;

		// When done, call on next slide or stop
		if ((!fade_in && opacity <= min) || (fade_in && opacity >= max)) {
      clearInterval(fadeTimer);
      element.style.display = !fade_in && "none";
      that.inFade = false;
      if (callback) callback();
    }

  }, step_len);
}

App.slide = function(fade_in) {
	var that = this;

  that.fade("slide" + that.slideIndex, fade_in, function() {
  	// Reached end of slides?
    if (that.slideIndex + 1 < that.slideCount) {
			if (fade_in) {
				// Wait to fade out
				that.slideTimeout = setTimeout(function() {
					that.slide(!fade_in);
				}, 2500);
			} else {
				that.slideIndex++;
				that.slide(!fade_in);
			}
		} else {
			that.slideTimeout = setTimeout(function() {
				that.enter();
			}, 2000);
		}
  });
}