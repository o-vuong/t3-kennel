(() => {
	function updateOnlineStatus() {
		const statusDot = document.querySelector(".status-dot");
		const statusText = document.querySelector(".status span");

		if (!(statusDot instanceof HTMLElement) || !(statusText instanceof HTMLElement)) {
			return;
		}

		if (navigator.onLine) {
			statusDot.style.background = "#51cf66";
			statusText.textContent = "Back online!";

			window.setTimeout(() => {
				window.location.href = "/";
			}, 2000);
		} else {
			statusDot.style.background = "#ff6b6b";
			statusText.textContent = "No internet connection";
		}
	}

	window.addEventListener("online", updateOnlineStatus);
	window.addEventListener("offline", updateOnlineStatus);

	updateOnlineStatus();

	if ("serviceWorker" in navigator) {
		void navigator.serviceWorker.ready.then(() => {
			console.log("Service Worker is ready for offline functionality");
		});
	}
})();
