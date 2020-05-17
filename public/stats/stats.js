var createSlider = (id, start, step, values, density) => {
	let e = document.getElementById(id);
	noUiSlider.create(e,{start,connect:true,step,range:{min:start[0],max:start[1]},pips:{mode:"values",values,density}});
	return e;
}
var comp_len = 20;

fetch("/list.json")
	.then(r => r.json())
	.then(a => {
		document.getElementById("num_works").textContent = a.length;
		let tier_max = Math.max.apply(Math, a.map(w => w.tier));

		let get_comps = (min_tier, max_tier) => {
			let comp_arr = a.filter(w => w.tier >= min_tier && w.tier <= max_tier).map(w => w.comp);
			let comp = [...new Set(comp_arr)];
			let comp_ct = comp.map(c => [c, comp_arr.filter(i => i === c).length]);
			comp_ct.sort((a, b) => b[1] - a[1]);
			return comp_ct;
		};
		let comp_ct = get_comps(0, tier_max);
		document.getElementById("num_comp").textContent = comp_ct.length;
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
		let comp_tier_slider = createSlider("comp-tier-range", [1, tier_max + 1], 1, [1, ...[...Array(11).keys()].map(x => (x + 1) * 10), tier_max + 1], 100/(tier_max + 1));
		comp_tier_slider.noUiSlider.on("set", new_tiers => {
			let comp_ct = get_comps(new_tiers[0] - 1, new_tiers[1] - 1);
			comp_chart.update({
				labels: comp_ct.map(c => c[0]).slice(0, comp_len),
				series: [comp_ct.map(c => c[1]).slice(0, comp_len)],
			});
		});

		let get_dates = (min_tier, max_tier) => {
			// remove dates with estimates (containing century dates)
			let date_arr = a.filter(w => w.tier >= min_tier && w.tier <= max_tier).map(w => w.raw_yr !== undefined && w.raw_yr.includes("cent") ? undefined : w.year).filter(e => e !== undefined);
			let date_min = Math.floor(Math.min.apply(Math, date_arr)/10)*10;
			let date_max = Math.floor(Math.max.apply(Math, date_arr)/10)*10;
			let date = [...Array((date_max - date_min)/10 + 1).keys()].map(i => i*10 + date_min);
			let date_ct = date.map(d => date_arr.filter(i => Math.floor(i/10)*10 === d).length);
			// extra zero bin so step interpolation works properly
			date.push(date[date.length-1] + 10);
			date_ct.push(0);
			return date.map((d, i) => { return {x: d, y: date_ct[i]} });
		};
		let date = get_dates(0, tier_max);
		document.getElementById("year_range").textContent = date[date.length-1].x - date[0].x;

		let date_chart = new Chartist.Line("#dates", {
			series: [date],
		}, {
			chartPadding: 0,
			axisX: {
				type: Chartist.FixedScaleAxis,
				high: date[date.length-1].x,
				low: date[0].x,
				ticks: date.map(d => d.x).filter(i => i % 50 === 0),
			},
			axisY: {
				onlyInteger: true,
				offset: 15,
			},
			showArea: true,
			fullWidth: true,
			showPoint: false,
			showLine: false,
			lineSmooth: Chartist.Interpolation.step(),
		},
		[
			["screen and (max-width: 80.0rem)", {
				axisX: {
					ticks: date.map(d => d.x).filter(i => i % 100 === 0),
				}
			}],
		]
		);
		let date_tier_slider = createSlider("date-tier-range", [1, tier_max + 1], 1, [1, ...[...Array(11).keys()].map(x => (x + 1) * 10), tier_max + 1], 100/(tier_max + 1));
		date_tier_slider.noUiSlider.on("set", new_tiers => {
			let date = get_dates(new_tiers[0] - 1, new_tiers[1] - 1);
			date_chart.update({
				series: [date],
			});
		});

		let tiers = [...Array(tier_max+1).keys()];
		let tier_ct = tiers.map(t => a.filter(w => w.tier === t).length);
		let tier_chart = new Chartist.Line("#tiers", {
			labels: tiers.map(i => i + 1),
			series: [tier_ct],
		}, {
			chartPadding: 0,
			axisX: {
				labelInterpolationFnc: function(value, index) {
					return value % 10 === 0 ? value : null;
				}
			},
			axisY: {
				onlyInteger: true,
				offset: 15,
			},
			//showArea: true,
			fullWidth: true,
			showPoint: false,
		},
		);

	});

