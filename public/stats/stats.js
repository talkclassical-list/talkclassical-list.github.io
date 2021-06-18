var createSlider = (id, start, step, values, density) => {
	let e = document.getElementById(id);
	noUiSlider.create(e,{start,connect:true,step,range:{min:start[0],max:start[1]},pips:{mode:"values",values,density}});
	return e;
}
var comp_len = 20;

fetch("/list.json")
	.then(r => r.json())
	.then(a => {
		let tier_max = Math.max.apply(Math, a.map(w => w.tier)) + 1;

		let get_comps = (min_tier, max_tier) => {
			let comp_arr = a.filter(w => w.tier >= min_tier && w.tier <= max_tier).map(w => w.comp);
			let comp = [...new Set(comp_arr)];
			let comp_ct = comp.map(c => [c, comp_arr.filter(i => i === c).length]);
			comp_ct.sort((a, b) => b[1] - a[1]);
			return comp_ct;
		};
		let comp_ct = get_comps(0, tier_max - 1);
		let comp_chart = new Chartist.Bar("#top_comp", {
			labels: comp_ct.map(c => c[0]).slice(0, comp_len),
			series: [comp_ct.map(c => c[1]).slice(0, comp_len)],
		}, {
			chartPadding: 0,
			axisY: {
				type: Chartist.AutoScaleAxis,
				onlyInteger: true,
				offset: 15,
			},
		},
		);
		let comp_tier_slider = createSlider("comp-tier-range", [1, tier_max], 1, [1, ...[...Array(Math.floor(tier_max/10)).keys()].map(x => (x + 1) * 10)], 100/(tier_max));
		comp_tier_slider.noUiSlider.on("set", new_tiers => {
			let comp_ct = get_comps(new_tiers[0] - 1, new_tiers[1] - 1);
			comp_chart.update({
				labels: comp_ct.map(c => c[0]).slice(0, comp_len),
				series: [comp_ct.map(c => c[1]).slice(0, comp_len)],
			});
		});

		let get_dates = () => {
			// remove dates with estimates (containing century dates)
			let date = a.filter(w => w.year !== undefined && (w.raw_yr === undefined || !w.raw_yr.includes("cent")));
			return date.map(d => { return {x: d.year, y: d.tier + 1} });
		};
		let date = get_dates();
		let date_min = Math.floor(Math.min.apply(Math, date.map(d => d.x))/10)*10;
		let date_max = Math.ceil(Math.max.apply(Math, date.map(d => d.x))/10)*10;
		console.log(date_max, date_min);
		let dates = [...Array(date_max-date_min+1).keys()].map(i => i+date_min);

		let date_chart = new Chartist.Line("#dates", {
			series: [date],
		}, {
			chartPadding: 0,
			axisY: {
				type: Chartist.FixedScaleAxis,
				high: tier_max + 1,
				low: 1,
				ticks: [...Array(tier_max).keys()].map(i => i+1).filter(i => i % 10 === 0),
				onlyInteger: true,
				offset: 15,
			},
			axisX: {
				type: Chartist.FixedScaleAxis,
				high: date_max,
				low: date_min,
				ticks: dates.filter(i => i % 50 === 0),
			},
			showArea: false,
			showPoint: true,
			showLine: false,
		},
		[
			["screen and (max-width: 80.0rem)", {
				axisX: {
					ticks: dates.filter(i => i % 100 === 0),
				},
			}],
		]
		);
	});

