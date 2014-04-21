// Prep DOM
document.addEventListener( "DOMContentLoaded", function(){
	
	// Start Initial slide transitions
	App.slideTimeout = setTimeout(function() {
		App.slide(false);
	}, 3000);

	// Update statistics

	// Github stars
	var stars = 0;
	App.get("https://api.github.com/repos/zackargyle/django-rest-framework-seed", 'callback', function(response) {
		stars += response.stargazers_count;
		App.get("https://api.github.com/repos/zackargyle/angularjs-django-rest-framework-seed", 'callback', function(response) {
			stars += response.stargazers_count;
			document.getElementById("gitStars").innerHTML = stars + " stargazers";
		});
	});

	// Stack Overflow Reputation
	App.get("http://api.stackoverflow.com/1.0/users/2642809/", 'jsonp', function(response) {
		if (response.users)
			document.getElementById("stackRep").innerHTML = response.users[0].reputation + " reputation";
	});

	// Get JSFiddle Count
	App.get("http://jsfiddle.net/api/user/zargyle/demo/list.json", 'callback', function(response) {
		document.getElementById("jsfiddle").innerHTML = response.overallResultSetCount + " fiddles";
	});

	/* Initialize game over listener */
	window.addEventListener("gameOver", function() {
    App.gameOver();
  }, false );

});