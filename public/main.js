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

var tier_expand = document.getElementById("tier-expand");
tier_expand.addEventListener("click", function() {
	let shrunk = this.classList.toggle("icon-arrows-expand-vertical1");
	this.classList.toggle("icon-arrows-shrink-vertical1");
	for (const tier of tiers) {
		let tier_items = tier.nextElementSibling;
		if (shrunk) {
			tier.classList.remove("active");
			tier_items.style.maxHeight = null;
		} else {
			tier.classList.add("active");
			tier_items.style.maxHeight = tier_items.scrollHeight + "px";
		}
	}
});
tier_expand.addEventListener("mouseleave", e => e.target.blur());
