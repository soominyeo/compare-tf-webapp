import { Link } from "react-router-dom";
import { Component } from "react";

class Home extends Component {
	render() {
		return (
			<div>
				<h1>home</h1>
				<div className="Home-links">
					<Link to="/main">Main</Link>
				</div>
			</div>
		);
	}
}

export default Home;
