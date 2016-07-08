var { Router, Route, IndexRoute, IndexLink, Link, withRouter } = ReactRouter;
var { Auth } = "./auth";

window.user = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkdvbGRlbkRyYWFrIiwicGFzc3dvcmQiOiIwYjMwOTliMTM0NWY2ZGQ3ZDA4YTgwYzRhZGFlYjNjNSIsImZhdm9yaXRlcyI6W10sImlhdCI6MTQ2Nzg1NzQwMn0.J7T1XuYh60Otv727StsVYxEK18MrwJ_RBXedPUbbDeI"
}

$.post("http://localhost:8000/login",
  {
    username: "GoldenDraak",
    password: "Ghent"
  },
  function(response, status, xhr) {
    if (response.user) {
      window.user = {
        token: response.user
      }

    }

  }

);

var Artist = React.createClass({
  getInitialState: function() {
    return {
      favorite: false
    }
  },

  componentDidMount: function(props) {
    var self = this;

    this.setState({
      favorite: self.props.favorite
    });

  },

  handleClick: function(evt) {
    var self = this;

    $.ajax({
        url: "http://localhost:8000/favorites/artist?token=" + window.user.token,
        type: 'PUT',
        data: {id: self.props.id},
        success: function(result) {
          self.setState({
            favorite: !self.state.favorite
          });
        }
    });

  },

  render: function() {
    var favorite = <i className="fa fa-heart-o" aria-hidden="true"></i>;

    if (this.state.favorite === true) {
      favorite = <i className="fa fa-heart" aria-hidden="true"></i>;
    }

    return <div className="row result" onClick={this.handleClick}>
      <div style={{backgroundImage: "url("+this.props.profile+")"}} className="col-xs-3 profile"></div>
      <p className="col-xs-8 name">{this.props.name}</p>
      <div className="col-xs-1 favorite">
        {favorite}
      </div>
    </div>

  }

});

var Search = React.createClass({
  getInitialState: function() {
    return {
      artists: []
    }

  },

  getArtists: function(evt) {
    if (evt.target.value.length > 2) {
      var self = this;

      $.get("http://localhost:8000/artists?token=" + window.user.token + "&q=" + evt.target.value)
      .then(function(response, status, xhr) {
        self.setState({
          artists: response.results

        });

      });

    }

  },

  render: function() {
    var artists = "Search for your favorite artists"

    if (this.state.artists.length > 0) {
      artists = this.state.artists.map(function(cur, idx, arr) {
        return <Artist key={cur.id} id={cur.id} profile={cur.image} name={cur.name} favorite={cur.favorite} />
      });
    }

    return (
      <div>
        <input type="text" refs="search" className="artistsSearch" onChange={this.getArtists}/>
        <div className="resultsWrapper">
          {artists}
        </div>
      </div>
    );

  }

});

 
var Favorites = React.createClass({
  getInitialState: function() {
    return {
      artists: []
    }
  },  

  componentDidMount: function(props) {
    var self = this;

    $.get("http://localhost:8000/favorites?token=" + window.user.token)
    .then(function(response, status, xhr) {
      self.setState({
        artists: response.favorites.artists
      }, function() {
        console.log("ARGS", arguments);
      });

    });

  },

  render: function() {
    var artists = "No favorites yet";

    if (this.state.artists.length > 0) {
      var self = this;

      artists = this.state.artists.map(function(cur, idx, arr) {
        if (cur.id) {
          return <Artist key={cur.id} id={cur.id} profile={cur.image} name={cur.name} favorite={true} />

        } else {
          $.get("http://localhost:8000/artists/" + cur + "?token=" + window.user.token)
          .then(function(response, status, xhr) {
            var favorites = self.state.artists;

            // favorites[response.id] = response;

            // self.setState({
            //   artists: favorites
            // });

          });

        }

      });

    }

      return (
        <div className="resultsWrapper">
          {artists}
        </div>
      );

    }

});

var Login = withRouter(React.createClass({
  componentWillMount: function(props) {
    console.log("ARGS", arguments);
  },

  componentWillReceiveProps: function(props) {
    console.log("PROPS", props);
  },

  handleSubmit: function(evt) {
    evt.preventDefault();

    var self = this;

    $.post("http://localhost:8000/login",
      {
        username: self.refs.username.value,
        password: self.refs.password.value
      },
      function(response, status, xhr) {
        if (response.user) {
          window.user = {
            token: response.user
          }
          
          // self.props.router.push("/search");
          self.props.router.replace("search");

        }

      }

    );

  },

  render: function() {
    return <div className="loginWrapper">
      <form id="login">
        <h1>Login</h1>
        <div className="loginInputWrapper"><input type="text" ref="username" className="loginInput" placeholder="username"/></div>
        <div className="loginInputWrapper"><input type="password" ref="password" className="loginInput" placeholder="password"/></div>
        <button onClick={this.handleSubmit}>
          Login
        </button>
      </form>
    </div>

  }

}));

var App = React.createClass({
  getInitialState: function() {
    return {
      token: null
    }
  },

  onChange: function(token) {
    this.setState({
      token: token
    });
  },

  render: function() {
    var navigation;

    if (this.state.token !== null) {
      navigation = <ul className="col-xs-12 header">
          <li><IndexLink to="/search" activeClassName="active">Artist</IndexLink></li>
          <li><Link to="/favorites" activeClassName="active">Favorites</Link></li>
        </ul>;
    }

    return (
      <div>
        {navigation}
        <div className="col-xs-offset-1 col-xs-10 content">
          <h1 className="center upper">My Favorites</h1>
          <h6 className="center upper">by Musikki</h6>
          {this.onChange, this.props.children}
        </div>
      </div>
    )
  }
});


function requireAuth(nextState, replaceState) {
  if (!window.user.token)
    replaceState({ nextPathname: nextState.location.pathname }, '/login')
}

ReactDOM.render(
  <Router>
    <Route path="/" component={App}>
      <IndexRoute component={Search} />
      <Route path="favorites" component={Favorites} />
      <Route path="login" component={Login} />
    </Route>
  </Router>,
  document.getElementById("container")
);