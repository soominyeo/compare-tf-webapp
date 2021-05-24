import { Component } from "react";
import {
	BrowserRouter as Router,
	Route,
	Switch,
	Redirect,
} from "react-router-dom";
import { Home, Main } from "./pages";
import "./App.css";

class App extends Component {
	render() {
		return (
			<div className="App-route">
				<Router>
					<Switch>
						<Route path="/main" component={Main} />
						<Route exact path="/" component={Home} />
						<Route path="/">
							<Redirect to="/" />
						</Route>
					</Switch>
				</Router>
			</div>
		);
	}
}

export default App;
