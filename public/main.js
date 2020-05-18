var nav_height = 0;
window.addEventListener("load", function() {
	nav_height = document.getElementsByClassName("navlist")[0].clientHeight;
});
const isElementInViewport = (el) => {
	let rect = el.getBoundingClientRect();
	return (
		rect.top >= nav_height &&
		rect.left >= 0 &&
		rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
		rect.right <= (window.innerWidth || document.documentElement.clientWidth)
	);
}

const braidArrays = (...arrays) => {
	const braided = [];
	for (let i = 0; i < Math.max(...arrays.map(a => a.length)); i++) {
		arrays.forEach((array) => {
			if (array[i] !== undefined) braided.push(array[i]);
		});
	}
	return braided;
};

var tiers = Array.from(document.getElementsByClassName("tier"));
for (const tier of tiers) {
	tier.addEventListener("click", function() {
		this.classList.toggle("active");
		let tier_items = this.nextElementSibling;
		tier_items.classList.toggle("active");
	});
}

var expanded = false;
var tier_expand = document.getElementById("tier-expand");
tier_expand.addEventListener("click", function() {
	expanded = !expanded;
	document.getElementById("fab-inner").classList.toggle("icon-arrows-expand-vertical1");
	document.getElementById("fab-inner").classList.toggle("icon-arrows-shrink-vertical1");
	let get_nearest_tier = () => {
		let nearest_tier = tiers.findIndex(isElementInViewport);
		let next_nearest = false;
		if (nearest_tier == -1) {
			nearest_tier = tiers.reduce((min, x, i, a) => {
				let xtop = x.getBoundingClientRect().top;
				let mintop = a[min].getBoundingClientRect().top;
				return (xtop > mintop && xtop < 0) ? i : min;
			}, 0);
			next_nearest = true;
		}
		let offset = tiers[nearest_tier].getBoundingClientRect().top;
		return [nearest_tier, next_nearest, offset];
	};
	let [nearest_tier, next_nearest, offset] = get_nearest_tier();
	let update_tiers = (tier_slice) => {
		window.requestAnimationFrame(function() {
			for (const tier of tier_slice) {
				let tier_items = tier.nextElementSibling;
					if (!expanded) {
						tier.classList.remove("active");
						tier_items.classList.remove("active");
						//tier_items.style.maxHeight = null;
					} else {
						tier.classList.add("active");
						tier_items.classList.add("active");
						//tier_items.style.maxHeight = "unset";
					}
			}
			if (nearest_tier !== 0) {
				tiers[nearest_tier].scrollIntoView();
				window.scrollBy(0, -(next_nearest && !expanded ? nav_height : offset));
			}
		});

	};

	let nearest_min = 0;
	let nearest_max = tiers.length-1;
	if (expanded) {
		nearest_min = nearest_tier > 0 ? nearest_tier-1 : nearest_tier;
		nearest_max = nearest_tier + 5;
	}
	update_tiers(tiers.slice(nearest_min, nearest_max));
	let rest = braidArrays(tiers.slice(0, nearest_min).reverse(), tiers.slice(nearest_max));
	let chunk_size = 5;
	let delay = 20;
	let chunk_len = Math.ceil(rest.length/chunk_size);
	for (var i = 0; i < chunk_len; i++) {
		let chunk = rest.slice(i*chunk_size, (i+1)*chunk_size);
		setTimeout(() => update_tiers(chunk), delay*(i+1));
	}
});
tier_expand.addEventListener("mouseleave", e => e.target.blur());
