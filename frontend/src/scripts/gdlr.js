import * as tf from "@tensorflow/tfjs";

function execute(data) {
	// console.log(tf.getBackend());

	tf.setBackend("cpu");

	try {
		const startTime = Date.now();

		tf.disposeVariables();
		const iteration = data.iteration || 500;
		const alpha = data.learningRate || 0.001;
		const initialValue = data.initialValue || 1;
		const userFunction = data.function || "0";
		const f = parseUserFunction(userFunction);

		const [opt_X, opt_Y] = gradientDescent(f, iteration, alpha, initialValue);

		const isOptNotFound =
			tf.logicalOr(opt_X.isNaN(), opt_X.isInf()).dataSync()[0] === 1;

		console.log(
			opt_X.isNaN().dataSync(),
			opt_X.isInf().dataSync(),
			opt_X.dataSync()
		);

		let center;
		if (isOptNotFound) {
			center = 0;
		} else {
			center = opt_X.dataSync()[0];
		}

		const N = data.N || 100;
		const range = (data.range &&
			data.range[0] &&
			data.range[1] &&
			data.range) || [center - 2, center + 2];

		const { regression, slope, intercept, X, Y } = linearRegression(
			f,
			range,
			N
		);
		const x = Array.from(X.dataSync());
		const graph = Array.from(Y.dataSync());
		const endTime = Date.now();

		const result = {
			success: true,
			graph: {
				x,
				y: graph,
			},
			optimum: { x: opt_X.dataSync()[0], y: opt_Y.dataSync()[0] },
			regression: {
				x,
				y: regression,
				slope: slope.dataSync()[0],
				intercept: intercept.dataSync()[0],
			},
			rangeX: { min: Math.floor(x[0]), max: Math.ceil(x[x.length - 1]) },
			rangeY: {
				min: Math.floor(Math.min(...graph, ...regression)),
				max: Math.ceil(Math.max(...graph, ...regression)),
			},
			time: endTime - startTime,
		};

		return result;
	} catch (error) {
		return { success: false, error };
	}

	function parseUserFunction(str) {
		const coeffs = str
			.split(/\s+/)
			.filter((value) => value !== "")
			.map((value) => parseInt(value, 10))
			.reverse();
		return (number) => {
			let result = tf.tensor(0);
			for (let index in coeffs) {
				result = tf.add(
					result,
					tf.mul(tf.pow(number, parseInt(index, 10)), coeffs[index])
				);
			}
			return result;
		};
	}

	function gradientDescent(f, iteration, alpha, initialValue) {
		const gradient = tf.grad(f);
		const gd = (x) => tf.sub(x, tf.mul(alpha, gradient(x)));

		const X = tf.variable(tf.tensor([initialValue]));
		for (let i in Array.from(Array(iteration).keys())) {
			X.assign(gd(X));
		}

		X.print();
		return [X, f(X)];
	}

	function linearRegression(f, range, N) {
		const X = tf.linspace(...range, N);
		const Y = f(X);

		// (N * Sum(X * Y) - Sum(X) * Sum(Y)) / (N * Sum(X ** 2) - Sum(X) ** 2)
		const slope = tf.div(
			tf.sub(tf.mul(N, tf.mul(X, Y).sum()), tf.mul(X.sum(), Y.sum())),
			tf.sub(tf.mul(N, X.square().sum()), X.sum().square())
		);
		// Sum(Y) / N - Sum(X) / N * slope
		const intercept = tf.sub(Y.sum().div(N), X.sum().div(N).mul(slope));
		const regression = Array.from(
			tf.add(tf.mul(slope, X), intercept).dataSync()
		);

		return { regression, slope, intercept, X, Y };
	}
}

export default execute;
