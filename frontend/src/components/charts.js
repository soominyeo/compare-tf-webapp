import { Line } from "react-chartjs-2";

const LineChart = (props) => {
	const defaultOptions = { aspectRatio: 1, responsive: true };

	return (
		<div className="Chart-wrapper">
			<div className="Chart-header">
				<div className="Chart-title">
					<p>{props.title}</p>
				</div>
			</div>
			<Line
				data={props.data}
				options={{ ...defaultOptions, ...props.options }}
			/>
		</div>
	);
};

export { LineChart };
