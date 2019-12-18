# GraphQL
GraphQL with React

## REST

| URL       | Method | Operation         |
| ----------|--------|-------------------|
| /posts    | POST   | Create a new post |
| /posts    | GET    | Fetch all posts   |
| /posts/14 | GET    | Fetch post 14     |
| /posts/15 | PUT    | Update post 15    |
| /posts/18 | DELETE | Delete post 18    |

Associations:

`/users/23/posts/14` -> nesting records

But if we start nesting more information, the Rest URL is not as straight forward anymore.

* Determine relationships
* Too many HTTP requests (for different tables)
* We don't always want ALL the info (some times just parts of info)
* REST convention gets more complicated when composed data

## On to GraphQL

```graphql
query {
    user(id: "23") {
        friends {
            company {
                name
            }
        }
    }
}
```

Datastore <=> Express/GraphQL Server <=> GraphiQL

```bash
mkdir users
cd users
npm init
npm install --save express express-graphql graphql lodash
touch server.js
```

The Express server receives a request from browser and if it's GraphQL request, it's called and responds.

Very minimal Express server code:
```javascript
const express = require('express');

const app = express();

app.listen(4000, () => {
    console.log('Listening');
});
```

Adding GraphQL related code:

```javascript
const express = require('express');
// compatibility layer between Express & GraphQL
const expressGraphQL = require('express-graphql');

const app = express();

// GraphiQL is for development.
app.use('/graphql', expressGraphQL({
    graphiql: true
}));

app.listen(4000, () => {
    console.log('Listening');
});
```

If we run this code, it will return a Schema error.
```
node server.js
```

Express' `app.use` method is related to middleware.

### GraphQL Schemas

We need a schema file

```bash
mkdir schema
touch schema/schema.js
```

schema.js
```javascript
const graphql = require('graphql');

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = graphql;

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
    }
});
```

Create a `RootQuery`
```javascript
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) {

            }
        }
    }
});
```

RootQuery is where GraphQL is going to get started. The most important part of it it's the `resolve` method.
`resolve` gets the `args` and defines where to start looking for the data.

schema.js
```javascript
const graphql = require('graphql');
const _ = require('lodash');

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema
} = graphql;

// Dummy data
const users = [
    {
        id: '23',
        firstName: 'Bill',
        age: 20
    },
    {
        id: '47',
        firstName: 'Samantha',
        age: 21
    },
]

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
    }
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) {
                return _.find(users, { id: args.id });
            }
        }
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery
});
```

If we set schema in server.js and schema has everything, we should be able to try http://localhost:4000/graphql.

```graphql
{
    user(id: "23") {
        id,
        firstName,
        age
    }
}
```

Running a simple Json server:

```
npm install --save json-server
touch db.json
```

db.json
```json
{
    "users": [
        { "id": "23", "firstName": "Bill", "age": 20 },
        {
            "id": "40",
            "firstName": "Alex",
            "age": 40
        }
    ]
}
```

package.json
```json
"scripts": {
    "json:server": "json-server --watch db.json"
},
```

```bash
npm run json:server
```

Schema's resolve method can also return a Promise.

```
npm install --save axios
```

schema.js fetching from API:
```javascript
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) {
                return axios.get(`http://localhost:3000/users/${args.id}`)
                    .then(resp => resp.data);
            }
        }
    }
});
```

### Nodemon

Install Nodemon so we don't need to restart the server for every change we make.

```
npm install --save nodemon
```

packages.json
```json
"scripts": {
    "dev": "nodemon server.js"
},
```

```
npm run dev
```

### Adding company definition

schema.js
```javascript
const CompanyType = new GraphQLObjectType({
  name: "Company",
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString }
  }
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: GraphQLString },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        company: {
            type: CompanyType,
            resolve(parentValue, args) {
                return axios
                  .get(`http://localhost:3000/companies/${parentValue.companyId}`)
                  .then(resp => resp.data);
            }
        }
    }
});
```

in the `UserType`, now you can use resolve to get the values for company. `parentValue` contains data from the User requesting company.

It's useful to think about this as we're querying for references to objects in our graph through the `resolve` function.

### Multiple RootQuery entry points

Now we want to be able to query for companies.

schema.js
```javascript
const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {...},
        company: {
            type: CompanyType,
            args: { id: { type: GraphQLString } },
            resolve(parentValue, args) {
                return axios
                  .get(
                    `http://localhost:3000/companies/${args.id}`
                  )
                  .then(resp => resp.data);
            }
        }
    }
});
```

Now we can query in GraphiQL:
```graphql
{
  company(id: "1") {
    name
  }
}
```

### Birectional relations

schema.js
```javascript
const CompanyType = new GraphQLObjectType({
  name: "Company",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
        type: new GraphQLList(UserType),
        resolve(parentValue, args) {
            return axios
                .get(`http://localhost:3000/companies/${parentValue.id}/users`)
                .then(resp => resp.data);
        }
    }
  })
});
```

We're using GraphQLList to get a list of Users.

Note that fields are now in a closure to avoid problems with type reference (Circular Reference).

### Query fragments

Naming the query:
```graphql
query findCompany {
  company(id: "1") {
    id
    name
    description
  }
}
```

Multiple instances (you need to name each query)
```graphql
{
  apple: company(id: "1") {
    id
    name
    description
  }
  google: company(id: "2") {
    id
    name
    description
  }
}
```

Query fragments (most common when querying in FE)
```graphql
{
  apple: company(id: "1") {
    ...companyDetails
  }
  google: company(id: "2") {
    ...companyDetails
  }
}

fragment companyDetails on Company {
  id
  name
  description
}
```

### Mutations

Change the data in some fashion (UPDATE, CREATE, DELETE)

schema.js
```javascript
const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, { firstName, age }) {
          return axios.post(`http://localhost:3000/users`, {
            firstName, age
          })
            .then(resp => resp.data);
      }
    }
  }
});
```

We're defining `addUser`. We expect `firstName` and `age` to be required and then we post the new values to the API.

```graphql
mutation {
    addUser(firstName: "Stephen", age: 26) {
        id
        firstName
        age
    }
}
```

In GraphQL it's expected to require a return value.


Deleting

```javascript
const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      // ...
    },
    deleteUser: {
        type: UserType,
        args: {
            id: { type: new GraphQLNonNull(GraphQLString) }
        },
        resolve(parentValue, args) {
            return axios.delete(`http://localhost:3000/users/${args.id}`)
                .then(resp => resp.data);
        }
    }
  }
});
```

```graphql
mutation {
  deleteUser(id: "23") {
    id
  }
}
```

PUT vs PATCH

* PUT - completely replace the existing record. (if you have empty info in the PUT, it will replace with null)
* PATCH - updates the available information, without overriding empty values.

schema.js
```javascript
const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {...},
    deleteUser: {...},
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, args) {
        return axios.patch(`http://localhost:3000/users/${args.id}`, args)
            .then(resp => resp.data);
      }
    }
  }
});
```

```graphql
mutation {
  editUser(id: "sYOlPnf", firstName: "Steve") {
    firstName
    age
  }
}
```

## Client side GraphQL

Javascript clients:
* Lokka - very simple client. Basic queries, mutations, simple caching.
* Apollo Client - good balance between features and complexity. Good to start with.
* Relay - Amazing performance for mobile. Most complex. - bad mobile connection.

We're using GraphQL Express, but there is Apollo Server, that we won't be using now.

* GraphQL Express - we instantiate GraphQL* objects
* Apollo Server - has types files (that looks like json), and resolvers file (functions using the types).

https://github.com/StephenGrider/Lyrical-GraphQL

Set up a free tier dev DB:
https://cloud.mongodb.com/v2/5ddf152b014b7608bc579314#clusters

Inside the lyrical project, run

```
npm run dev
```

Now you should be able to access http://localhost:4000/graphql

```graphql
mutation {
    addSong(title: "Cold Night") {
        id
    }
}
```

```graphql
mutation {
    addLyricToSong(songId: "5de1c7d63a5e93497b1c94be", content: "Oh my oh my its a cold night") {
        id
    }
}
```

```graphql
{
    songs {
        id
        title
        lyrics {
            content
        }
    }
}
```

Client side:

* Apollo Privider - connects with Apollo Store
    * Our React App
* Apollo Store - Connects with GraphQL

Basic Apollo setup in client:
```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import ApolloClient from 'apollo-client';
import { ApolloProvider } from 'react-apollo';

const client = new ApolloClient({});

const Root = () => {
  return (
    <ApolloProvider client={client}><div>Lyrical</div></ApolloProvider>
  );
};

ReactDOM.render(
  <Root />,
  document.querySelector('#root')
);
```

GraphQL + React Strategy
1. Identify data required
2. Write query in Graphiql and in component file
3. Bond query + component
4. Access data

```graphql
{
    songs {
        title
    }
}
```

graphql queries are not valid JS code. So we'll use graphql-tag library.

```javascript
//...
import gql from 'graphql-tag';

class SongList extends Component {...}

const query = gql`
  {
    songs {
      title
    }
  }
`;
// ...
```

Binding the graphql query with the component:
```javascript
// ...
import { graphql } from 'react-apollo';

class SongList extends Component {...}

const query = gql`...`;

export default graphql(query)(SongList);
```

This looks like Redux. The query result will be coming through props.

Showing up the data in the component:

```javascript
// ...
class SongList extends Component {
  renderSongs() {
    return this.props.data.songs.map(song => {
      return (
      <li key={song.id} className="collection-item">{song.title}</li>
      )
    });
  }
  render() {
    if (this.props.data.loading) {
      return (<div>Loading...</div>);
    }
    return (<ul className="collection">{this.renderSongs()}</ul>);
  }
}
// ...
```

We're using GraphQL's `data.loading` property to make sure to only show the list in case it's done loading.

We also started fetching id to use it as `key` for out list items.

Setting up react router

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, hashHistory, IndexRoute } from 'react-router';
//...
import App from './components/App';
import SongList from './components/SongList';
//...
const Root = () => {
  return (
    <ApolloProvider client={client}>
      <Router history={hashHistory}>
        <Route path="/" component={App}>
          <IndexRoute component={SongList} />
        </Route>
      </Router>
    </ApolloProvider>
  );
};
//...
```

Using onSubmit in order to add a new title.

First we tested a mutation in GraphiQL:

```graphql
mutation {
  addSong(title: "Dog Call") {
    id
    title
  }
}
```

Query variables

GraphiQL has another section called query variables.

```graphql
mutation AddSong($title: String) {
  addSong(title: $title) {
    id
    title
  }
}
```

We're now naming our mutation and declaring a variable for it.

Think it like a function declaration.

Query Variables
```
{
  "title": "Sprite vs Coke"
}
```

Using Apollo to persist the changes into GraphQL:

SongCreate
```javascript
import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

class SongCreate extends Component {
// ...
    onSubmit(event) {
        event.preventDefault();
        // This is how we send the title param into GraphQL:
        this.props.mutate({
            variables: {
                title: this.state.title
            }
        });
    }
// ...
}

const mutation = gql`
mutation AddSong($title: String) {
  addSong(title: $title) {
    title
  }
}
`;
// Wrap our component using Apollo's graphql.
export default graphql(mutation)(SongCreate);
```

Apollo tends to not re-fetch data that already fetched.
So if you start the app in the list page, it fetches the latest list, and if we create a new song throught the flow, after creating and redirecting back to the list, Apollo will just assume it just loaded the list, so it doesn't need to fetch it again.
We have to forcefully ask Apollo to fetch the whole list after adding a new one.

In order to re-use some queries, create a new folder called queries.

SongCreate.js
```javascript
//...
import {Link, hashHistory} from 'react-router';
// This is the fetch list query to get all songs.
import query from '../queries/fetchSongs';

class SongCreate extends Component {
    //...
    onSubmit(event) {
        event.preventDefault();

        this.props.mutate({
            variables: {
                title: this.state.title
            },
            // we need to re-run the fetch list query
            refetchQueries: [{ query: query }]
        })
        .then(() => hashHistory.push('/'))
        .catch(e => console.error(e));
    }
  //...
}
//...
```

Deleting a song

The mutation will look like this:
```graphql
mutation DeleteSong($id: ID) {
  deleteSong(id: $id) {
    id
  }
}
```

Using the delete:
```javascript
//...

class SongList extends Component {
  onSongDelete(id) {
    this.props.mutate({ variables: { id }})
      // we can refresh the current component query after deleting.
      .then(() => this.props.data.refetch());
  }

  renderSongs() {
    // destructed the song to make it cleaner
    return this.props.data.songs.map(({id, title}) => {
      return (
        <li key={id} className="collection-item">
          {title}
          <i className="material-icons" onClick={() => this.onSongDelete(id)}>
            delete
          </i>
        </li>
      )
    });
  }
//...
}

const mutation = gql`
mutation DeleteSong($id: ID) {
  deleteSong(id: $id) {
    id
  }
}
`;

// needs to nest a little bit in order to use query and delete mutation
export default graphql(mutation)(
  graphql(query)(SongList)
);
```

### Fetching individual records

```graphql
query SongQuery($id: ID!) {
  song(id: $id) {
    id
    title
  }
}

# query variable
{
  "id": "5dee6f624bbca9a9749ccd2a"
}
```

Create in queries/fetchSong.js file:
```javascript
import gql from "graphql-tag";

export default gql`
  query SongQuery($id: ID!) {
    song(id: $id) {
      id
      title
    }
  }
`;
```

We can use props in order to pass info as params for our query:
```javascript
import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import fetchSong from '../queries/fetchSong';

class SongDetail extends Component {
    render() {
        return(
            <div>
                <h3>Song Detail</h3>
            </div>
        )
    }
}

export default graphql(fetchSong, {
    options: (props) => { return { variables: { id: props.params.id}}}
})(SongDetail);
```

Add lyric to song

```graphql
mutation AddLyricToSong($content: String, $songId: ID) {
  addLyricToSong(content: $content, songId: $songId) {
    id
    lyrics {
      content
    }
  }
}

{
  "songId": "5dee6f624bbca9a9749ccd2a",
  "content": "It was a long night"
}
```

Refreshing data with changes.

We need to let Apollo know to identify changes using id:

client/index.js
```javascript
const client = new ApolloClient({
  // use the id to identify the object
  dataIdFromObject: o => o.id
});
```

only fetches without using caching in case changes happens to objects that have id.