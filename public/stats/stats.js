var createSlider = (id, start, step, values, density) => {
	let e = document.getElementById(id);
	noUiSlider.create(e,{start,connect:true,step,range:{min:start[0],max:start[1]},pips:{mode:"values",values,density}});
	return e;
}
var comp_ctx = document.getElementById("composers");
var comp_len = 20;

fetch("/list.json")
	.then(r => r.json())
	.then(a => {
		let comp_arr = a.map(w => w.comp);
		let comp = [...new Set(comp_arr)];
		let comp_ct = []
		for (const c of comp) {
			let ct = comp_arr.filter(i => i===c).length;
			comp_ct.push([c, ct]);
		}
		comp_ct.sort((a, b) => a[1] - b[1]).reverse();
		new Chartist.Bar("#top_comp", {
			labels: comp_ct.map(c => c[0]).slice(0, comp_len),
			series: [comp_ct.map(c => c[1]).slice(0, comp_len)],
		}, {
			axisY: {
				type: Chartist.AutoScaleAxis,
				onlyInteger: true,
			}
		},
		);
		// remove dates with estimates (containing century dates)
		let date_arr = a.map(w => w.raw_yr !== undefined && w.raw_yr.includes("cent") ? undefined : w.year).filter(e => e !== undefined);
		let date_min = Math.min.apply(Math, date_arr);
		let date_max = Math.max.apply(Math, date_arr);
		let date = [...Array(date_max - date_min + 1).keys()].map(i => i + date_min).filter(i => i % 10 === 0);
		let date_ct = date.map(d => date_arr.filter(i => Math.floor(i/10)*10 === d).length);
		// extra zero bin so step interpolation works properly
		date.push(date[date.length-1] + 10);
		date_ct.push(0);

		let date_chart = new Chartist.Line("#dates", {
			labels: date,
			series: [date_ct],
		}, {
			axisX: {
				labelInterpolationFnc: function(value, index) {
					return value % 50 === 0 ? value : null;
				}
			},
			axisY: {
				onlyInteger: true,
			},
			low: 0,
			showArea: true,
			fullWidth: true,
			showPoint: false,
			showLine: false,
			lineSmooth: Chartist.Interpolation.step(),
		},
		[
			["screen and (max-width: 80.0rem)", {
				axisX: {
					labelInterpolationFnc: function(value, index) {
						return value % 100 === 0 ? value : null;
					}
				}
			}],
		]
		);
		let tier_max = Math.max.apply(Math, a.map(w => w.tier));
		let tier_slider = createSlider("tier-range", [1, tier_max + 1], 1, [1, ...[...Array(11).keys()].map(x => (x + 1) * 10), tier_max + 1], 100/(tier_max + 1));
		tier_slider.noUiSlider.on("set", new_tiers => {
			let [tier_slide_min, tier_slide_max] = new_tiers;
			let filtered = a.filter(w => w.tier >= tier_slide_min && w.tier <= tier_slide_max);
			let date_arr = filtered.map(w => w.raw_yr !== undefined && w.raw_yr.includes("cent") ? undefined : w.year).filter(e => e !== undefined);
			let date_min = Math.min.apply(Math, date_arr);
			let date_max = Math.max.apply(Math, date_arr);
			let date = [...Array(date_max - date_min + 1).keys()].map(i => i + date_min).filter(i => i % 10 === 0);
			let date_ct = date.map(d => date_arr.filter(i => Math.floor(i/10)*10 === d).length);

			date_chart.update({
				labels: date,
				series: [date_ct],
			});
		});

		let tiers = [...Array(tier_max+1).keys()];
		let tier_ct = tiers.map(t => a.filter(w => w.tier === t).length);
		let tier_chart = new Chartist.Line("#tiers", {
			labels: tiers.map(i => i + 1),
			series: [tier_ct],
		}, {
			axisX: {
				labelInterpolationFnc: function(value, index) {
					return value % 10 === 0 ? value : null;
				}
			},
			axisY: {
				onlyInteger: true,
			},
			//showArea: true,
			fullWidth: true,
			showPoint: false,
			//showLine: false,
		},
		);

	});

