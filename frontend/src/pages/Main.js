import * as _ from "lodash";
import { Component } from "react";
import { AppTemplate } from "../components/common";
import { LineChart } from "../components/charts";
import { default as GDLR } from "../scripts/gdlr";

const scripts = {
	CLI_JS: {
		id: "client-js",
		text: "Client",
		run: (data, callback) => callback(GDLR(data)),
	},
	SERV_JS: {
		id: "server-js",
		text: "Server/JS",
		run: (data, callback) => {
			fetch("/api/gdlr/js", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
				credentials: "same-origin",
			})
				.then((response) => response.json())
				.then((result) => {
					callback(result);
				});
		},
	},
	SERV_PYTHON: {
		id: "server-python",
		text: "Server/Python",
		run: (data, callback) => {
			fetch("/api/gdlr/python", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
				credentials: "same-origin",
			})
				.then((response) => response.json())
				.then((result) => {
					callback(result);
				});
		},
	},
};

class UserInput extends Component {
	static inputs = {
		function: {
			description: "함수",
			length: 1,
			type: "text",
			checkRegex: /^(((\d*)|(-\d+))\s)*((-?\d*))$/,
			props: {
				placeholder: "aN ... a2 a1 a0",
			},
		},
		range: {
			description: "범위",
			length: 2,
			type: "number",
			props: {
				placeholder: "1.0",
				step: "any",
			},
		},
		learningRate: {
			description: "학습율",
			length: 1,
			type: "number",
			props: {
				placeholder: "0.001",
				step: "any",
				min: 0,
				max: 1,
			},
		},
		iteration: {
			description: "반복",
			length: 1,
			type: "number",
			props: {
				placeholder: "500",
				step: 1,
				min: 0,
			},
		},
	};

	constructor(props) {
		super(props);

		this.state = {
			data: Object.entries(UserInput.inputs).reduce((acc, pair) => {
				const [key, value] = pair;
				if (value.length > 1) acc[key] = [];
				else if (value.type === "text") acc[key] = "";
				else if (value.type === "number") acc[key] = 0;
				else acc[key] = undefined;

				return acc;
			}, {}),
		};

		this.setState.bind(this);
	}

	handleInputChange(name, value) {
		this.setState(({ data }) => ({
			data: {
				...data,
				[name]: value,
			},
		}));
	}

	handSubmit(type) {
		this.props.onSubmit(this.state.data, scripts[type]);
	}

	render() {
		const inputs = [];

		for (let name in UserInput.inputs) {
			let input = UserInput.inputs[name];
			inputs.push(
				<InputItem
					type={input.type}
					name={name}
					length={input.length}
					checkRegex={input.checkRegex}
					inputProps={input.props}
					onValueChange={(value) => {
						this.handleInputChange.bind(this)(name, value);
					}}
					key={name}
				>
					{input.description}
				</InputItem>
			);
		}

		const buttons = [];

		for (let type in scripts) {
			let script = scripts[type];
			buttons.push(
				<button onClick={() => this.handSubmit.bind(this)(type)} key={type}>
					{script.text}
				</button>
			);
		}

		return (
			<div className="Input-wrapper">
				{inputs}
				<div className="Input-submit">{buttons}</div>
			</div>
		);
	}
}

class InputItem extends Component {
	constructor(props) {
		super(props);

		this.state = {
			data: Array(props.length).fill(props.type === "number" ? 0 : ""),
		};
	}

	handleChange(i, event) {
		let value = event.target.value.replace(/\s{2,}/, " ");
		const regex = this.props.checkRegex || /.*/;

		if (!regex.test(value)) {
			event.target.value = this.state.data[i];
		} else {
			event.target.value = value;

			value = value.trim(/\s-?/);
			this.setState(
				({ data }) => ({
					data: [
						...data.slice(0, i),
						this.props.type === "number"
							? this.props.inputProps.step === "any"
								? parseFloat(value)
								: parseInt(value, 10)
							: value,
						...data.slice(i + 1),
					],
				}),
				() => {
					this.props.onValueChange(
						this.props.length === 1 ? this.state.data[0] : this.state.data
					);
				}
			);
		}
	}

	render() {
		const inputs = [];
		for (let i = 0; i < this.props.length; i++) {
			inputs.push(
				<input
					key={i}
					name={this.props.name}
					type={this.props.type}
					{...this.props.inputProps}
					onChange={(event) => this.handleChange.bind(this)(i, event)}
				/>
			);
		}

		return (
			<div className="Input-item">
				<div className="Input-desc">
					<label>{this.props.children}</label>
				</div>
				<div className="Input-field">{inputs}</div>
			</div>
		);
	}
}

class Main extends Component {
	constructor(props) {
		super(props);
		this.state = {
			data: [],
			options: {
				scales: {
					x: {
						type: "linear",
						grid: {
							drawTicks: false,
						},
					},

					y: {
						grid: {
							drawTicks: false,
						},
					},
				},
			},
		};
	}

	handleSubmit(data, script) {
		script.run({ ...data, iteration: 1000 }, (result) => {
			console.log(result);
			if (result.success) {
				const graph = {
					label:
						"f(x) = " +
						data.function
							.split(/\s/)
							.reverse()
							.map((value, index) =>
								index === 0 ? value : `${value}x^${index}`
							)
							.reverse()
							.join(" + "),
					data: result.graph.x.map((x, index) => {
						return { x, y: result.graph.y[index] };
					}),
					pointBackgroundColor: "rgba(0,0,0,0)",
					pointBorderColor: "rgba(0,0,0,0)",
					backgroundColor: "rgba(0,0,0, 0.3)",
					borderColor: "rgba(0,0,0,0.6)",
				};
				const optimum = {
					label: "Optimum",
					data: [{ x: result.optimum.x, y: result.optimum.y }],
					pointRadius: 6,
					pointHoverRadius: 8,
					pointBackgroundColor: "rgba(0, 0, 0, 0.5)",
				};
				const regression = {
					label:
						"Regression: " +
						`y = ${result.regression.slope.toFixed(
							3
						)}x + ${result.regression.intercept.toFixed(3)}`,
					data: result.regression.x.map((x, index) => {
						return { x, y: result.regression.y[index] };
					}),

					pointBackgroundColor: "rgba(0,0,0,0)",
					pointBorderColor: "rgba(0,0,0,0)",
					backgroundColor: "rgba(200,0,0, 0.3)",
					borderColor: "rgba(200,0,0,0.6)",
				};

				this.setState(({ options }) => ({
					data: {
						datasets: [graph, regression, optimum],
					},
					options: _.merge(options, {
						scales: {
							x: {
								ticks: {
									stepSize:
										Math.floor((result.rangeY.max - result.rangeY.min) / 10) ||
										1,
									suggestedMax: result.rangeX.max + 2,
									suggestedMin: result.rangeX.min - 2,
								},
							},

							y: {
								ticks: {
									stepSize:
										Math.floor((result.rangeY.max - result.rangeY.min) / 10) ||
										1,
									suggestedMax: result.rangeY.max + 2,
									suggestedMin: result.rangeY.min - 2,
								},
							},
						},
					}),
				}));

				const log = document.querySelector(".log");
				log.innerHTML = `Elapsed time: ${result.time / 1000}s`;
				if (result.totalTime)
					log.innerHTML += `, Actual time: ${result.totalTime / 1000}`;
				log.classList.remove("log-failure");
			} else {
				const log = document.querySelector(".log");
				log.innerHTML = `Failed to Execute script: ${
					result.error || "unknown error"
				}`;
				log.classList.add("log-failure");
			}
		});
	}

	render() {
		return (
			<AppTemplate
				appName="main"
				appTitle="Gradient Descent & Linear Regression"
			>
				<div className="App-content">
					<LineChart
						title="Chart"
						data={this.state.data}
						options={this.state.options}
					/>
					<label className="log"></label>
				</div>
				<div className="App-input">
					<UserInput onSubmit={this.handleSubmit.bind(this)} />
				</div>
			</AppTemplate>
		);
	}
}

export default Main;
