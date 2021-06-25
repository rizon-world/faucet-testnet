import React, { Component } from 'react';
import { BrowserRouter as Router, Route } from 'react-router-dom';
import './App.scss';
import Home from './Pages/Home';
import bgImage from './assets/faucetimg.svg';

class App extends Component {
  showCurrentYear() {
    return new Date().getFullYear();
  }
  render() {
    return (
      <Router>
        <div className="fullWrapper">
          <img className="background" src={bgImage} alt="background reousrce"/>
          <Route exact path="/" component={Home} />
          <footer>&copy; {this.showCurrentYear()} <span>RIZON</span> </footer>
        </div>
      </Router>
    );
  }
}

export default App;
