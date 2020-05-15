var tiers = document.getElementsByClassName("tier");
for (const tier of tiers) {
	tier.addEventListener("click", function() {
		this.classList.toggle("active");
		let tier_items = this.nextElementSibling;
		if (tier_items.style.maxHeight) {
			tier_items.style.maxHeight = null;
		} else {
			tier_items.style.maxHeight = tier_items.scrollHeight + "px";
		}
	});
}
