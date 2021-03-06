/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Image,
  ListView,
} = React;

var ReactCBLite = require('react-native').NativeModules.ReactCBLite;
ReactCBLite.init(5984, 'admin', 'password', (e) => {
});

var {manager} = require('react-native-couchbase-lite');

var ReactNativeCouchbaseLiteExample = React.createClass({
  render: function () {
    return (
      <Home></Home>
    );
  }
});

var Home = React.createClass({
  getInitialState() {
    return {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      sequence: '',
      filteredMovies: ''
    }
  },
  componentDidMount() {
    var database = new manager('http://admin:password@localhost:5984/', 'myapp');
    database.createDatabase()
      .then((res) => {
        database.createDesignDocument('main', {
          'filters': {
            'year': 'function (doc) { if (doc.year === 2004) {return true;} return false;}'
          },
          'views': {
            'movies': {
              'map': 'function (doc) {if (doc.year) {emit(doc._id, null);}}'
            }
          }
        });
        database.replicate('http://localhost:4984/moviesapp', 'myapp');
        database.getInfo()
          .then((res) => {
            database.listen({since: res.update_seq - 1, feed: 'longpoll'});
            database.changesEventEmitter.on('changes', function (e) {
              this.setState({sequence: e.last_seq});
            }.bind(this));
            // database.listen({seq: 0, feed: 'longpoll', filter: 'main/year'});
            // database.changesEventEmitter.on('changes', function (e) {
            //   this.setState({filteredMovies: e.last_seq});
            // }.bind(this));
          });
      })
      .then((res) => {
        return database.queryView('main', 'movies', {include_docs: true});
      })
      .then((res) => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(res.rows)
        });
      })
      .catch((ex) => {
        console.log(ex)
      });
  },
  render() {
    return (
      <View>
        <Text style={styles.seqTextLabel}>
          The database sequence: {this.state.sequence}
        </Text>
        <Text>
          Movies published in 2004: {this.state.filteredMovies}
        </Text>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this.renderMovie}
          style={styles.listView}/>
      </View>
    )
  },
  renderMovie(movie) {
    var movie = movie.doc;
    return (
      <View style={styles.container}>
        <Image
          source={{uri: movie.posters.thumbnail}}
          style={styles.thumbnail}/>
        <View style={styles.rightContainer}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.year}>{movie.year}</Text>
        </View>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  rightContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  year: {
    textAlign: 'center',
  },
  thumbnail: {
    width: 53,
    height: 81,
  },
  listView: {
    backgroundColor: '#F5FCFF',
  },
  seqTextLabel: {
    textAlign: 'center',
    margin: 5
  }
});

AppRegistry.registerComponent('ReactNativeCouchbaseLiteExample', () => ReactNativeCouchbaseLiteExample);