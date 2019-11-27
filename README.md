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