var nav_height = 0;
window.addEventListener("load", function() {
	nav_height = document.getElementsByClassName("navcontainer")[0].clientHeight;
});
function isElementInViewport (el) {
	let rect = el.getBoundingClientRect();
	console.log(rect.top, nav_height);
	return (
		rect.top >= nav_height &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

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

var expanded = false;
var tier_expand = document.getElementById("tier-expand");
tier_expand.addEventListener("click", function() {
	expanded = !expanded;
	document.getElementById("fab-inner").classList.toggle("icon-arrows-expand-vertical1");
	document.getElementById("fab-inner").classList.toggle("icon-arrows-shrink-vertical1");
	let nearest_tier = Array.from(tiers).findIndex(isElementInViewport);
	for (const tier of tiers) {
		let tier_items = tier.nextElementSibling;
		if (!expanded) {
			tier.classList.remove("active");
			tier_items.style.maxHeight = null;
		} else {
			tier.classList.add("active");
			tier_items.style.maxHeight = tier_items.scrollHeight + "px";
		}
	}
	if (!isElementInViewport(tiers[0])) {
		tiers[nearest_tier].scrollIntoView();
		window.scrollBy(0, -nav_height);
	}
});
tier_expand.addEventListener("mouseleave", e => e.target.blur());
