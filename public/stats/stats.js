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
		console.log(date, date_ct);

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
		);

		let date_min_rd = Math.floor(date_min/100)*100;
		let date_slider = createSlider("date-range", [date_min_rd, date_max], 20, [...Array(11).keys()].map(x => (x + date_min_rd/100) * 100), 2000/(date_max - date_min_rd));
		date_slider.noUiSlider.on("set", new_dates => {
			let [date_slide_min, date_slide_max] = new_dates;
			let date_min_idx = date.indexOf(Math.floor(date_slide_min));
			date_min_idx = date_min_idx === -1 ? 0 : date_min_idx;
			let date_max_idx = date.indexOf(Math.floor(date_slide_max));
			date_max_idx = date_max_idx === -1 ? date.length-1 : date_max_idx;
			console.log(date_slide_min, date_slide_max, date_min_idx, date_max_idx);
			date_chart.update({
				labels: date.slice(date_min_idx, date_max_idx),
				series: [date_ct.slice(date_min_idx, date_max_idx)],
			});
		});

	});

