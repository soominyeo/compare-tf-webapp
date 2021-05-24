import { Link } from "react-router-dom";

function AppHeader(props) {
	const appTitle = props.appTitle || "title";
	return (
		<div className="App-header">
			<div className="App-navigators">
				<AppNavigator className="Navigator Navigator-home" appName="home" />
				{/* <AppNavigator
					className="Navigator Navigator-now "
					appName={props.appName}
				/> */}
			</div>
			<div className="App-title">
				<p>{appTitle}</p>
			</div>
		</div>
	);
}

function AppNavigator(props) {
	const appName = props.appName || "home";
	const href = appName === "home" ? "/" : "/" + appName;
	return (
		<Link to={href}>
			<span className={props.className}>
				<img
					src={process.env.PUBLIC_URL + `/apps/${appName}/logo192.png`}
					alt={appName}
				/>
			</span>
		</Link>
	);
}

function AppTemplate(props) {
	return (
		<div className="App">
			<AppHeader appName={props.appName} appTitle={props.appTitle} />
			<div className="App-body">{props.children}</div>
		</div>
	);
}

export { AppTemplate };
