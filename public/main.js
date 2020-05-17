var nav_height = 0;
window.addEventListener("load", function() {
	nav_height = document.getElementsByClassName("navcontainer")[0].clientHeight;
});
function isElementInViewport (el) {
	let rect = el.getBoundingClientRect();
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
	let next_nearest = false;
	if (nearest_tier == -1) {
		nearest_tier = Array.from(tiers).reduce((min, x, i, a) => {
			let xtop = x.getBoundingClientRect().top;
			let mintop = a[min].getBoundingClientRect().top;
			return (xtop > mintop && xtop < 0) ? i : min;
		}, 0);
		next_nearest = true;
	}
	let offset = tiers[nearest_tier].getBoundingClientRect().top;
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
		window.scrollBy(0, -(next_nearest && !expanded ? nav_height : offset));
	}
});
tier_expand.addEventListener("mouseleave", e => e.target.blur());
