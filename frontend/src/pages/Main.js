import * as _ from "lodash";
import { Component } from "react";
import { AppTemplate } from "../components/common";
import { LineChart } from "../components/charts";
import { default as GDLR } from "../scripts/gdlr";

const scripts = {
	CLI_JS: {
		id: "client-js",
		text: "Client",
		run: (data) => GDLR(data),
	},
	SERV_JS: { id: "server-js", text: "Server/JS", run: (data) => {} },
	SERV_PYTHON: {
		id: "server-python",
		text: "Server/Python",
		run: (data) => {},
	},
};

class UserInput extends Component {
	static inputs = {
		function: {
			description: "함수",
			length: 1,
			props: {
				placeholder: "a0 a1 a2 ...",
				type: "text",
			},
		},
		range: {
			description: "범위",
			length: 2,
			props: {
				placeholder: "1.0",
				type: "number",
				step: "any",
			},
		},
		learningRate: {
			description: "학습율",
			length: 1,
			props: {
				placeholder: "0.001",
				type: "number",
				step: "any",
				value: "0.001",
			},
		},
	};

	constructor(props) {
		super(props);

		this.state = {
			data: Object.entries(UserInput.inputs).reduce((acc, pair) => {
				const [key, value] = pair;
				if (value.length > 1) acc[key] = [];
				else if (value.props.type === "text") acc[key] = "";
				else if (value.props.type === "number") acc[key] = 0;
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
					{...input.props}
					name={name}
					key={name}
					length={input.length}
					onValueChange={(value) => {
						this.handleInputChange.bind(this)(name, value);
					}}
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
		const value = event.target.value.trim();
		this.setState(
			({ data }) => ({
				data: [
					...data.slice(0, i),
					this.props.type === "number" ? parseInt(value, 10) : value,
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

	render() {
		const inputs = [];
		for (let i = 0; i < this.props.length; i++) {
			inputs.push(
				<input
					name={this.props.name}
					key={i}
					type={this.props.type}
					placeholder={this.props.placeholder}
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
		const result = script.run(data);

		if (result.success) {
			const graph = {
				label:
					"f(x) = " +
					data.function
						.split(/\s/)
						.map((value, index) => (index === 0 ? value : `${value}x^${index}`))
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
									Math.floor((result.rangeY.max - result.rangeY.min) / 10) || 1,
								suggestedMax: result.rangeX.max + 2,
								suggestedMin: result.rangeX.min - 2,
							},
						},

						y: {
							ticks: {
								stepSize:
									Math.floor((result.rangeY.max - result.rangeY.min) / 10) || 1,
								suggestedMax: result.rangeY.max + 2,
								suggestedMin: result.rangeY.min - 2,
							},
						},
					},
				}),
			}));
		} else {
			alert("execution failed!");
		}
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
				</div>
				<div className="App-input">
					<UserInput onSubmit={this.handleSubmit.bind(this)} />
				</div>
			</AppTemplate>
		);
	}
}

export default Main;
